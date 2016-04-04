// TODO: Change `asap` to something more effective?
const asap = setTimeout;

export default function EventHandler() {
  const allHandlers = {};

  /**
   * @param {string} type
   * @param {Function} func
   */
  this.on = this.addEventListener = function (type, func) {
    const handlers = allHandlers[ type ];

    if (handlers) {
      handlers.push(func);
    } else {
      allHandlers[ type ] = [ func ];
    }

    return this;
  };

  /**
   * @param {string} type
   * @param {Function} func
   */
  this.off = this.removeEventListener = function (type, func) {
    const handlers = allHandlers[ type ];

    if (handlers) {
      handlers.splice(handlers.indexOf(func), 1);
    }

    return this;
  };

  /**
   * @param {string} type
   * @param {Object=} data
   */
  this.emit = this.dispatchEvent = function (type, data) {
    let handlers = allHandlers[ type ];

    if (handlers) {
      handlers = handlers.slice();

      asap(function () {
        handlers.forEach(function (handler) {
          handler(data);
        });
      });
    }

    return this;
  };

  return this;
}
