# wisper-js
The JavaScript implementation of a simple, JSON-based RPC protocol.

Details about the wisper protocol itself can be found [here](https://bitbucket.org/WidespaceGIT/wisper-protocol/src).

## Getting Started
Take a look at the documentation for the [`Bridge` class](./src/bridges/), it's at the core of `wisper-js` and will point you in the right direction for everything else.

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

// TODO: actually implement `exposeFunction`
bridge.exposeFunction('add', function add(x, y) {
  return x + y;
});
```
