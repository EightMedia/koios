var EventEmitter = require("events").EventEmitter;
var assign = require("object-assign");

/**
 * Dispatcher
 * The only task of the dispatcher is to notify
 * all handlers which actions have taken place.
 * Dispatcher should never have to handle any values directly,
 * it just passes them along.
 */

var Dispatcher = assign({}, EventEmitter.prototype, {
  dispatch: function(payload) {
    if (!payload.type || payload.type.trim() === "" || payload.type === null) {
      throw new EventError("Invalid event name: " + payload.type);
    }
    this.emit(payload.type, payload);
  }
});

// set max number of listeners
// this prevents: (node) warning: possible EventEmitter memory leak detected.
// 11 listeners added. Use emitter.setMaxListeners() to increase limit.
Dispatcher.setMaxListeners(200);

module.exports = Dispatcher;
window.dispatcher = Dispatcher;

/**
 * Event error
 */

function EventError(message) {
  this.name = "EventError";
  this.message = message || "Event error";
  this.stack = new Error().stack;
}

EventError.prototype = Object.create(Error.prototype);
EventError.prototype.constructor = EventError;

module.exports.EventError = EventError;
