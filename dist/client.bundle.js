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

	"use strict";

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	//standardize to work the same way as the server

	var SyncReduxClient = function () {
	  function SyncReduxClient(url) {
	    _classCallCheck(this, SyncReduxClient);

	    this.url = url;
	    this.store = null;
	    this.readyToSend = false;
	    this.debug = false;
	    this.autoReconnect = true;
	  }

	  /**
	   * Set if the client must send debug information to the console
	   * @param debug
	   */


	  _createClass(SyncReduxClient, [{
	    key: "setDebug",
	    value: function setDebug() {
	      var debug = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

	      this.debug = debug;
	    }

	    /**
	     * Init a connection with the server
	     * @param store
	     */

	  }, {
	    key: "init",
	    value: function init() {
	      var _this = this;

	      var store = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

	      try {
	        this.ws = new WebSocket(this.url);
	      } catch (e) {
	        this.store.dispatch({ type: "@@SYNC-CONNECT-SERVER-FAILED", url: this.url });
	        return;
	      }
	      // No store previously declared
	      if (this.store === null) {
	        if (store === null) {
	          throw 'A store is required when the server have never been initialised with it';
	        }
	        this.store = store;
	        // Store already defined and param not null
	      } else if (store !== null) {
	          this.store = store;
	        } else {
	          // Store already defined but param null, ignoring
	        }
	      this.ws.onopen = function () {
	        if (this.debug) {
	          console.log("Sync connected!");
	        }
	        //send a state dump
	        this.readyToSend = true;
	        var state = this.store.getState() || {};
	        this.store.dispatch({ type: "@@SYNC-CONNECT-SERVER-END", state: state });
	      }.bind(this);

	      this.ws.onmessage = function (event) {
	        if (_this.debug) {
	          console.log("Sync: Received some stuff from the server", event.data);
	        }
	        _this.store.dispatch(JSON.parse(event.data));
	      };
	      this.ws.onclose = function () {
	        if (_this.autoReconnect) {
	          setTimeout(_this.init.bind(_this), 1000);
	        }
	      };
	    }

	    /**
	     * Send an action to the server
	     *
	     * @param action
	     */

	  }, {
	    key: "send",
	    value: function send(action) {
	      this.ws.send(JSON.stringify(action));
	    }

	    /**
	     * Middleware for Redux
	     * @returns {Function}
	     */

	  }, {
	    key: "getClientMiddleware",
	    value: function getClientMiddleware() {
	      var _this2 = this;

	      return function (store) {
	        return function (next) {
	          return function (action) {
	            //need to enrich next action.
	            if (_this2.debug) {
	              console.log('Sync: dispatching ', action);
	            }
	            var result = next(action);
	            // If the action have been already emited, we don't send it back to the server
	            if (_this2.readyToSend && action.senderId === undefined) {
	              _this2.send(action);
	            }
	            //should be migrated to a reducer?
	            if (action.type === "@@SYNC-CONNECT-SERVER-START") _this2.init();
	            return result;
	          };
	        };
	      };
	    }

	    /**
	     * Set the client behavior in case the socket connection is closed/notStarted
	     *
	     * @param reconnect
	     */

	  }, {
	    key: "setAutoReconnect",
	    value: function setAutoReconnect(reconnect) {
	      this.autoReconnect = reconnect;
	    }
	  }]);

	  return SyncReduxClient;
	}();

	;

	module.exports = SyncReduxClient;

/***/ }
/******/ ])
});
;