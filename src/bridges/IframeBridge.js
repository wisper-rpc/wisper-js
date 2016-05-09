import BaseBridge from './BaseBridge.js';

export default class IframeBridge extends BaseBridge {
  /**
   * Creates an IframeBridge, which communicates with another window.
   *
   * @param  {Window} targetWindow
   */
  constructor(targetWindow) {
    super();
    this.target = targetWindow;
    window.addEventListener('message', this);
  }

  /**
   * Sends JSON by invoking `targetWindow.postMessage`.
   *
   * @private
   * @override
   * @param {string} json
   */
  sendJSON(json) {
    this.target.postMessage(json, '*');
  }

  /**
   * Handles messages sent to this window. If the source of the Event
   * is our target window, the data is routed into the bridge.
   *
   * @private
   * @param {Event} msg
   */
  handleEvent(msg) {
    if (msg.source === this.target) {
      this.receiveJSON(msg.data);
    }
  }

  close() {
    super.close();
    window.removeEventListener('message', this);
  }
}
