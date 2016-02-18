import interfaceName from './objects/interfaceName.js';
import Local from './objects/Local.js';
import properties from './objects/properties.js';
import Remote from './objects/Remote.js';


export { Local, Remote, interfaceName, properties };


// Decorator to mark methods of an exported class private, or `secret`.
export function secret(target, key, descriptor) {
  descriptor.value.secret = true;
}
