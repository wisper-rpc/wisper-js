# wisper-js
The JavaScript implementation of a simple, JSON-based RPC protocol.

Details about the wisper protocol itself can be found [here](https://github.com/wisper-rpc/wisper-protocol/).

Take a look at the documentation for the [`Bridge` class](./src/bridges/), it's at the core of `wisper-js` and will point you in the right direction for everything else.

## Getting Started

#### Install
```
npm install wisper-rpc
```

#### Example: Communicating across an Iframe boundary
To communicate across an iframe boundary we can use the `IframeBridge`, which sends JSON using `postMessage`.

```js
import { IframeBridge } from 'wisper-js';

// Get the iframe, and create the bridge.
const iframe = document.querySelector('iframe');
const bridge = new IframeBridge(iframe.contentWindow);

// Go ahead and call remote functions using the `notify`and `invoke` methods.
bridge.invoke( 'add', [ 1, 2 ] ).then( result => {
  assert.equal( result, 3 );
}, error => {
  // Handle errors here.
});
```

From within the iframe, we instead do:
```js
import { IframeBridge } from 'wisper-js';

const bridge = new IframeBridge(parent);

bridge.exposeFunction('add', function add(x, y) {
  return x + y;
});
```

## Remote objects
It is also possible to create Remote objects and talk to them (almost) like if they were local classes.

#### Example: Remote objects - Local implementation
```js
@interfaceName( bridge, 'DomNode' )
class DomNode extends Local {
  constructor(query) {
    super();
    this.match = document.querySelector(query);
  }

  style(obj) {
    if (this.match && this.match.style && obj && Object.keys(obj).length > 0) {
      Object.keys(obj).forEach(key => this.match.style[key] = obj[key]);
      return true;
    }
    return false;
  }
}
```

#### Example: Remote objects - Remote implementation
```js
@interfaceName( bridge, 'DomNode' )
class DomNode extends Remote {
	style(obj) {
		return this.bridge.invokeAsync( this.interfaceName + ':style', [ this.id, obj ] );
	}
}

// Change the background color on the other side of the bridge
const body = new DomNode('body');
body.style({ background: 'purple' });
```

For more detailed information on Remote objects, take a look at [Objects](./src/objects/).
