import InterfaceName from './objects/InterfaceName';
import Local from './objects/Local';
import Properties from './objects/Properties';
import Remote from './objects/Remote';

export { Local, Remote, InterfaceName, Properties };


// Decorator to mark methods of an exported class private, or `secret`.
export function secret(target, key, descriptor) {
  descriptor.value.secret = true;
}
