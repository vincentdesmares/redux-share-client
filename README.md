# redux-share-client
Share redux state across the network between multiple clients and server!

The system is currently provided with an express middleware for the server side implementation, while the client is agnostic.

This package is experimental and API will change.


The client a bit more complex, as your need to sync your state with the server upon connection.

The server is available for express [here](https://github.com/baptistemanson/redux-share-server)

```javascript
//client.js
var SyncReduxClient = require('redux-share-client');

var syncReduxClient = new SyncReduxClient('ws://localhost:2000');

//apply the middleware
store = createStore(reducer,applyMiddleware(syncReduxClient.getClientMiddleware()));

//open a socket to the server, then dump the state to the server
store.dispatch({type:"@@SYNC-CONNECT-SERVER-START"});
```


## List of special actions (client)


* @@SYNC-CONNECT-SERVER-START: called on the client to init state synchronization. This action will not be seen by the server.
* @@SYNC-CONNECT-SERVER-END: called on the client after the connection is successful, with the state in the payload. This action is the first the server will see.

