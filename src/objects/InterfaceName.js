import EventEmitter from 'events';
import ClassRouter from './ClassRouter';


// Decorator for `Remote` and `Local` classes.
// Exposes the classes through the bridge.
export default function InterfaceName(bridge, name) {
  return cls => {
    if (!bridge.expose(name, ClassRouter.routing(name, cls))) {
        console.error(`Route '${name}' already exposed.`);
        return;
    }

    EventEmitter.call(cls);

    Object.defineProperty(cls, 'instances', { value: Object.create(null) });

    Object.defineProperties(cls.prototype, {
      'interfaceName': { value: name },
      'bridge':        { value: bridge }
    });
  };
}
