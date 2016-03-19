(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["ReduxShareClient"] = factory();
	else
		root["ReduxShareClient"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/dist/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var ReduxShareClient = function () {

	  /**
	  * Constructs a new ReduxShareClient.
	  *
	  * @param string url a fully qualified websocket url.
	  * @param options. 
	  * 
	  * defaultOptions = {
	  *     //delay between reconnect tries
	  *     autoReconnectDelay:1000,
	  *     //null for unlimited autoReconnect, 0 will disable autoReconnect, 1 will try only once etc.
	  *     autoReconnectMaxTries:null,
	  *     //callback called just before sending to the server.
	  *     shouldSend:null,
	  *     debug:false,
	  *   };
	  *
	  */

	  function ReduxShareClient(url, options) {
	    _classCallCheck(this, ReduxShareClient);

	    //properties
	    var defaultOptions = {
	      //delay between reconnect tries
	      autoReconnectDelay: 1000,
	      //null for unlimited autoReconnect, 0 will disable autoReconnect, 1 will try only once etc.
	      autoReconnectMaxTries: null,
	      //callback called just before sending to the server.
	      shouldSend: null,
	      debug: false
	    };

	    this.options = Object.assign({}, defaultOptions, options);

	    //state
	    this.url = url;
	    this.store = null;
	    this.readyToSend = false;
	    this.connectTriesCount = 0;
	  }

	  /**
	   * Get the middleware for Redux
	   *
	   * @returns {Function}
	   */


	  _createClass(ReduxShareClient, [{
	    key: 'getClientMiddleware',
	    value: function getClientMiddleware() {
	      var _this = this;

	      return function (store) {
	        return function (next) {
	          return function (action) {
	            //need to enrich next action.
	            var result = next(action);
	            // If the action have been already emited, we don't send it back to the server
	            if (_this.readyToSend) {
	              _this.send(action);
	            }
	            //should be migrated to a reducer?
	            if (action.type === "@@SYNC-CONNECT-SERVER-START") _this.init(store);
	            return result;
	          };
	        };
	      };
	    }

	    /**
	     * Inits a connection with the server
	     * @param store
	     */

	  }, {
	    key: 'init',
	    value: function init() {
	      var _this2 = this;

	      var store = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

	      this.log('Initializing the socket');
	      this.ws = new WebSocket(this.url);

	      if (store === null) {
	        throw 'You must provide a redux store as the sole parameter of the init function.';
	      }

	      this.store = store;

	      this.ws.onerror = function () {
	        _this2.store.dispatch({ type: "@@SYNC-CONNECT-SERVER-FAILED", url: _this2.url });
	      };

	      this.ws.onopen = function () {
	        this.log('Socket initialized, sending a dump of the full state to the server.');
	        this.connectTriesCount = 0;
	        //send a state dump
	        var state = this.store.getState() || {};
	        this.readyToSend = true;
	        this.store.dispatch({ type: "@@SYNC-CONNECT-SERVER-SUCCESS", state: state });
	      }.bind(this);

	      this.ws.onmessage = function (event) {
	        _this2.log("Received an action from the server", event.data);
	        _this2.store.dispatch(JSON.parse(event.data));
	      };

	      this.ws.onclose = function () {
	        _this2.readyToSend = false;
	        _this2.log("Socket closed.");
	        _this2.reconnect();
	      };
	    }

	    /**
	     * Sends an action to the server
	     *
	     * @param action
	     */

	  }, {
	    key: 'send',
	    value: function send(action) {
	      if (typeof this.options.shouldSend == 'function' && !this.options.shouldSend(action)) {
	        return;
	      } else {
	        this.log('Sending to the server the action ', action);
	        this.ws.send(JSON.stringify(action));
	      }
	    }

	    /**
	    * Called internally.
	    *
	    */

	  }, {
	    key: 'reconnect',
	    value: function reconnect() {
	      if (this.options.autoReconnectMaxTries === null || this.connectTriesCount < this.options.autoReconnectMaxTries) {
	        this.log("Reconnecting automatically... " + this.connectTriesCount++);
	        setTimeout(this.init.bind(this, this.store), this.options.autoReconnectDelay);
	      } else if (this.connectTriesCount == this.options.autoReconnectMaxTries) {
	        this.log("Reached the maximum of authorized reconnect tries.");
	        this.store.dispatch({ type: "@@SYNC-CONNECT-SERVER-FAILED-FATAL", url: this.url });
	      }
	    }

	    /**
	    * Internal log function
	    *
	    */

	  }, {
	    key: 'log',
	    value: function log() {
	      if (this.options.debug) {
	        var _console;

	        (_console = console).log.apply(_console, ["redux-share-client: "].concat(Array.prototype.slice.call(arguments)));
	      }
	    }
	  }]);

	  return ReduxShareClient;
	}();

	;

	module.exports = ReduxShareClient;

/***/ }
/******/ ])
});
;