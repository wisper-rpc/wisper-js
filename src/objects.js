import interfaceName from './objects/InterfaceName';
import Local from './objects/Local';
import properties from './objects/Properties';
import Remote from './objects/Remote';


export { Local, Remote, interfaceName, properties };


// Decorator to mark methods of an exported class private, or `secret`.
export function secret(target, key, descriptor) {
  descriptor.value.secret = true;
}
