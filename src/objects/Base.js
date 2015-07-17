import EventEmitter from 'events';

export default class Base extends EventEmitter {
  constructor() {
    super();

    // Create the instance's `_repr_` property.
    const props = Object.create(this._repr_.props);
    this._repr_ = Object.create(this._repr_);
    this._repr_.props = props;
  }
}

Base.prototype._repr_ = Object.create(Object.prototype);
