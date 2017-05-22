import EventHandler from '../events.js';
import ClassRouter from './ClassRouter.js';


export function createClassRouter(bridge, name, cls) {
  // Constructor be called several times on same object.
  EventHandler.call(cls);

  return ClassRouter.routing(bridge, name, cls);
};

// Decorator for `Remote` and `Local` classes.
// Exposes the classes through the bridge.
export default function interfaceName(bridge, name, cls) {
  return cls => {
    const router = createClassRouter(bridge, name, cls);

    if (!bridge.expose(name, router)) {
      throw new Error(`Route '${name}' already exposed.`);
    }
  };
}
