import set from 'lodash-es/set';
import BaseBridge from './BaseBridge.js';

export default class PropertyBridge extends BaseBridge {
  constructor(target, receiveProperty, send) {
    super();
    set( this.target = target, this.receiveProperty = receiveProperty, json => {
      this.receiveJSON(json);
    });
    this.sendJSON = send;
  }

  close() {
    super.close();
    set(this.target, this.receiveProperty, null);
  }
}
