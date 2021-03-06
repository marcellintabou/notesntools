/*jslint indent: 2, maxlen: 80, nomen: true */
"use strict";

// keywords: js, javascript, nodejs events.EventEmitter

/**
 * Inspired by nodejs EventEmitter class
 * http://nodejs.org/api/events.html
 *
 * When an EventEmitter instance experiences an error, the typical action is
 * to emit an 'error' event. Error events are treated as a special case in
 * node. If there is no listener for it, then the default action throws the
 * exception again.
 *
 * All EventEmitters emit the event 'newListener' when new listeners are added
 * and 'removeListener' when a listener is removed.
 *
 * @class EventEmitter
 * @constructor
 */
function EventEmitter() {
  this._events = {};
  this._maxListeners = 10;
}

/**
 * Adds a listener to the end of the listeners array for the specified
 * event.
 *
 * @method addListener
 * @param  {String} event The event name
 * @param  {Function} listener The listener callback
 * @return {EventEmitter} This emitter
 */
EventEmitter.prototype.addListener = function (event, listener) {
  var listener_list;
  this.emit("newListener", event, listener);
  listener_list = this._events[event];
  if (listener_list === undefined) {
    this._events[event] = listener;
    listener_list = listener;
  } else if (typeof listener_list === "function") {
    this._events[event] = [listener_list, listener];
  } else {
    listener_list.push(listener);
  }
  if (this._maxListeners > 0 &&
      ((typeof listener_list === "function" && 1 > this._maxListeners) ||
       (typeof listener_list !== "function" &&
        listener_list.length > this._maxListeners)) &&
      listener_list.warned !== true) {
    console.warn("warning: possible EventEmitter memory leak detected. " +
                 listener_list.length + " listeners added. " +
                 "Use emitter.setMaxListeners() to increase limit.");
    listener_list.warned = true;
  }
  return this;
};

/**
 * #crossLink "EventEmitter/addListener:method"
 *
 * @method on
 */
EventEmitter.prototype.on = EventEmitter.prototype.addListener;

/**
 * Adds a one time listener for the event. This listener is invoked only the
 * next time the event is fired, after which it is removed.
 *
 * @method once
 * @param  {String} event The event name
 * @param  {Function} listener The listener callback
 * @return {EventEmitter} This emitter
 */
EventEmitter.prototype.once = function (event, listener) {
  var that = this;
  var wrappedListener = function () {
    that.removeListener(event, wrappedListener);
    listener.apply(listener, arguments);
  };
  return that.on(event, wrappedListener);
};

/**
 * Remove a listener from the listener array for the specified event.
 * Caution: changes array indices in the listener array behind the listener
 *
 * @method removeListener
 * @param  {String} event The event name
 * @param  {Function} listener The listener callback
 * @return {EventEmitter} This emitter
 */
EventEmitter.prototype.removeListener = function (event, listener) {
  var listener_list, i;
  if (this._events[event]) {
    listener_list = this._events[event];
    if (typeof listener_list === "function") {
      if (listener_list === listener) {
        delete this._events[event];
      }
    } else {
      for (i = 0; i < listener_list.length; i += 1) {
        if (listener_list[i] === listener) {
          listener_list.splice(i, 1);
          this.emit("removeListener", event, listener);
          break;
        }
      }
      if (listener_list.length === 1) {
        this._events[event] = listener_list[0];
      }
      if (listener_list.length === 0) {
        this._events[event] = undefined;
      }
    }
  }
  return this;
};

/**
 * Removes all listeners, or those of the specified event.
 *
 * @method removeAllListeners
 * @param  {String} event The event name (optional)
 * @return {EventEmitter} This emitter
 */
EventEmitter.prototype.removeAllListeners = function (event) {
  var key;
  if (event === undefined) {
    for (key in this._events) {
      if (this._events.hasOwnProperty(key)) {
        this.removeAllListeners(key);
      }
    }
    return this;
  }
  this._events[event] = undefined;
  return this;
};

/**
 * By default EventEmitters will print a warning if more than 10 listeners
 * are added for a particular event. This is a useful default which helps
 * finding memory leaks. Obviously not all Emitters should be limited to 10.
 * This function allows that to be increased. Set to zero for unlimited.
 *
 * @method setMaxListeners
 * @param  {Number} max_listeners The maximum of listeners
 */
EventEmitter.prototype.setMaxListeners = function (max_listeners) {
  this._maxListeners = max_listeners;
};

/**
 * Execute each of the listeners in order with the supplied arguments.
 *
 * @method emit
 * @param  {String} event The event name
 * @param  {Any} [args]* The listener argument to give
 * @return {Boolean} true if event had listeners, false otherwise.
 */
EventEmitter.prototype.emit = function (event) {
  var i, argument_list = [], listener_list = [];
  if (!this._events[event]) {
    return false;
  }
  // cloning listeners
  for (i = 0; i < this._events[event].length; i += 1) {
    listener_list.push(this._events[event][i]);
  }
  // create argument_list
  for (i = 1; i < arguments.length; i += 1) {
    argument_list.push(arguments[i]);
  }
  // call cloned listeners
  for (i = 0; i < listener_list.length; i += 1) {
    try {
      listener_list[i].apply(this, argument_list);
    } catch (e) {
      if (this.listeners("error").length > 0) {
        this.emit("error", e);
      } else {
        throw e;
      }
    }
  }
  return true;
};

/**
 * Returns an array of listeners for the specified event.
 *
 * @method listeners
 * @param  {String} event The event name
 * @return {Array} The array of listeners
 */
EventEmitter.prototype.listeners = function (event) {
  if (this._events[event]) {
    return this._events[event];
  }
  return [];
};

/**
 * Static method; Return the number of listeners for a given event.
 *
 * @method listenerCount
 * @static
 * @param  {EventEmitter} emitter The event emitter
 * @param  {String} event The event name
 * @return {Number} The number of listener
 */
EventEmitter.listenerCount = function (emitter, event) {
  return emitter.listeners(event).length;
};

exports.EventEmitter = EventEmitter;

////////////////////////////////////////////////////////////////////////////////

// keywords: js, javascript, nodejs events.EventEmitter, clonable

var util = require('util');
var deepClone = require('./deepClone.js').deepClone;

/**
 * An EventEmitter with an added method to clone this object.
 *
 * @class ClonableEventEmitter
 * @constructor
 */
function ClonableEventEmitter() {
  EventEmitter.call(this);
}
util.inherits(ClonableEventEmitter, EventEmitter);

/**
 * Returns a clone of this object.
 *
 * @method clone
 * @return {ClonableEventEmitter} The clone of this object
 */
ClonableEventEmitter.prototype.clone = function () {
  var new_one = new ClonableEventEmitter(), i, j;
  new_one._maxListeners = deepClone(this._maxListeners);
  new_one._events = deepClone(this._events);
  return new_one;
};

exports.ClonableEventEmitter = ClonableEventEmitter;
