import EventHandler from '../events.js';
import ClassRouter from './ClassRouter.js';


export const createClassRouter = ClassRouter.routing;

// Decorator for `Remote` and `Local` classes.
// Exposes the classes through the bridge.
export default function interfaceName(bridge, name) {
  return cls => {
    const router = ClassRouter.routing(bridge, name, cls);

    if (!bridge.expose(name, router)) {
      throw new Error(`Route '${name}' already exposed.`);
    }

    // Constructor be called several times on same object.
    EventHandler.call(cls);
  };
}
