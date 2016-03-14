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

	Object.defineProperty(exports, "__esModule", {
		value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	//standardize to work the same way as the server

	var SyncReduxClient = function () {
		function SyncReduxClient(url) {
			_classCallCheck(this, SyncReduxClient);

			this.url = url;
			this.readyToSend = false;
		}

		_createClass(SyncReduxClient, [{
			key: "init",
			value: function init(store) {
				var _this = this;

				this.ws = new WebSocket(this.url);
				this.store = store;
				this.ws.onopen = function () {
					console.log("Sync connected!");
					//send a state dump
					this.readyToSend = true;
					var state = this.store.getState() || {};
					this.store.dispatch({ type: "@@SYNC-CONNECT-SERVER-END", state: state });
				}.bind(this);

				this.ws.onmessage = function (event) {
					console.log("Sync: Received some stuff from the server", event.data);
					_this.store.dispatch(JSON.parse(event.data));
				};
				this.ws.onclose = function () {
					return setTimeout(_this.init.bind(_this), 1000);
				};
			}
		}, {
			key: "send",
			value: function send(action) {
				this.ws.send(JSON.stringify(action));
			}
		}, {
			key: "getClientMiddleware",
			value: function getClientMiddleware() {
				var _this2 = this;

				return function (store) {
					return function (next) {
						return function (action) {
							//need to enrich next action.
							console.log('Sync: dispatching ', action);
							var result = next(action);
							if (_this2.readyToSend) _this2.send(action);
							//should be migrated to a reducer?
							if (action.type === "@@SYNC-CONNECT-SERVER-START") _this2.init(store);
							return result;
						};
					};
				};
			}
		}]);

		return SyncReduxClient;
	}();

	exports.default = SyncReduxClient;

/***/ }
/******/ ])
});
;