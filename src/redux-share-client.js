class ReduxShareClient {

  /**
  * Constructs a new ReduxShareClient.
  *
  * @param string url a fully qualified websocket url.
  * @param options. 
  * 
  * defaultOptions = {
      //delay between reconnect tries
      autoReconnectDelay:1000,
      //null for unlimited autoReconnect, 0 will disable autoReconnect, 1 will try only once etc.
      autoReconnectMaxTries:null,
      //if set, this function will be called before receiving each action. Allow you to modify the action.
      onActionReceived: action => action,
      //if set, this function will filter all actions before dispatching. Returns bool.
      shouldDispatch:() => true, 
      //if set, this function will filter all actions before sending. Returns bool.
      shouldSend: () => true,
      debug:false,
  *
  */
  constructor (url, options) {
    //properties
    const defaultOptions = {
      //delay between reconnect tries
      autoReconnectDelay:1000,
      //null for unlimited autoReconnect, 0 | null will disable autoReconnect, 1 will try only once etc.
      autoReconnectMaxTries:null,
      //if set, this function will be called before receiving each action. Allow you to modify the action.
      onActionReceived: action => action,
      //if set, this function will be be called when the connection is established with the server
      onConnect: ws => true,
      //if set, this function will filter all actions before dispatching. Returns bool.
      shouldDispatch:() => true, 
      //if set, this function will filter all actions before sending. Returns bool.
      shouldSend: () => true,
      debug:false,
    };

    this.options = Object.assign({},defaultOptions,options);

    //state
    this.url = url;
    this.store = null;
    this.readyToSend = false;
    this.connectTriesCount = 0;
  }

  /**
   * Get the middleware for Redux
   *

      store.dispatch  WS
             |        |
             |  onActionReceived()
             |        |
             v        v 
        +------------------+
        |                  |
        |                  |
        |    Middleware    |
        |                  |
        |                  |
        +--------+---------+
                 |      
         ShouldDispatch()? --------+
                 |                 |
      (next middleware...then)     |
        +--------v---------+       |
        |                  |       |
        |                  |       |
        |     Reducers     |       |
        |                  |       |
        |                  |       |
        +--------+---------+       |
                 |                 |
                 |<----------------+
                 |
        +--------v---------+
        |                  |
        |    Middleware    |
        |                  |
        +--------+---------+
                 |      
                 V
            ShouldSend()? 
                 |
                 V
                 WS
    + onConnect.

   * @returns {Function}
   */
  getReduxMiddleware () {
    return store => next => action => {

       //should dispatch?
      if(this.options.shouldDispatch.apply(this,action) ) {
        var result = next(action);
      }
      else {
        var result = null;
      }

      // If the action have been already emited, we don't send it back to the server
      if (this.readyToSend && action.origin !== 'server') {
        this.send(action);
      }
      //should be migrated to a reducer?
      if (action.type === "@@SYNC-CONNECT-SERVER-START") this.init(store);

      return result;
    }
  }

  getChecksum(state) {
    return md5(JSON.stringify(state));
  }

  /**
   * Inits a connection with the server
   * @param store
   */
  init (store = null) {
    this.log('Initializing the socket');
    this.ws = new WebSocket(this.url);

    if(store === null ) {
       throw 'You must provide a redux store as the sole parameter of the init function.';
    }
    
    this.store = store;

    this.ws.onerror = () => {
      this.store.dispatch({type: "@@SYNC-CONNECT-SERVER-FAILED", url: this.url});
    };

    this.ws.onopen = function () { 
      this.log('Socket initialized, sending a dump of the full state to the server.'); 
      if (typeof(this.options.onConnect) == 'function') {
          this.options.onConnect.apply(this,[this.ws]);
      }

      this.connectTriesCount = 0;
      //send a state dump
      let state = this.store.getState() || {};
      this.readyToSend = true;
      this.store.dispatch({type: "@@SYNC-CONNECT-SERVER-SUCCESS", state: state});
    }.bind(this);

    this.ws.onmessage = event => {
      let action = event.data
      this.log("Received an action from the server", action);

      if (typeof(this.options.onActionReceived) == 'function') {
          action = this.options.onActionReceived.apply(this, [action])
      }

      this.store.dispatch(JSON.parse(action));
    }
    
    this.ws.onclose = () => {
      this.readyToSend = false;
      this.log("Socket closed.")
      this.reconnect();      
  }
}

  /**
   * Sends an action to the server
   *
   * @param action
   */
  send (action) {
    if(this.options.shouldSend(action)) {
      let tracedAction = Object.assign({},action,{origin:"client" });
      this.log('Sending to the server the action ', tracedAction);
      this.ws.send(JSON.stringify(tracedAction ));
    }
  }

  /**
  * Called internally.
  *
  */
  reconnect() {
    if (this.options.autoReconnectMaxTries === null || this.connectTriesCount < this.options.autoReconnectMaxTries) {
        this.log("Reconnecting automatically... "+this.connectTriesCount++);
        setTimeout(this.init.bind(this, this.store), this.options.autoReconnectDelay)
      }
      else if(this.connectTriesCount == this.options.autoReconnectMaxTries) {
        this.log("Reached the maximum of authorized reconnect tries.");
        this.store.dispatch({type: "@@SYNC-CONNECT-SERVER-FAILED-FATAL", url: this.url});
      }
  }

  /**
  * Internal log function
  *
  */
  log() {
    if (this.options.debug) {
        console.log("redux-share-client: ",...arguments);
      }
  }

};

module.exports = ReduxShareClient;
