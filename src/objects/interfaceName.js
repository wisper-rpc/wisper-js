import EventEmitter from 'events';
import ClassRouter from './ClassRouter';
import Remote from './Remote';


// Decorator for `Remote` and `Local` classes.
// Exposes the classes through the bridge.
export default function interfaceName(bridge, name) {
  return cls => {
    const router = ClassRouter.routing(bridge, name, cls);

    if (!bridge.expose(name, router)) {
      throw new Error(`Route '${name}' already exposed.`);
    }

    // Constructor be called several times on same object.
    EventEmitter.call(cls);

    // `Remote` classes only have one bridge, and one map of instances.
    if (cls.prototype instanceof Remote) {
      Object.defineProperty(cls, 'instances', { value: Object.create(null) });

      Object.defineProperties(cls.prototype, {
        'interfaceName': { value: name },
        'bridge': { value: bridge }
      });
    }
  };
}
