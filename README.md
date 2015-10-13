# wisper-js
The JavaScript implementation of a simple, JSON-based RPC protocol.

1. [Getting Started](#getting-started)
1. [The Bridge API](#the-bridge-api)

## Getting Started

#### Native WebView
It's possible to communicate to Native platforms through the `GlobalBridge`.

Supply the string name of a globally accessible function for the native code to send it's JSON messages through, and a (platform specific) function that sends JSON to the native code.
```js
import { GlobalBridge } from 'wisper-js';

const bridge = new GlobalBridge('globalFunctionName', function (json) {
  window.external.notify('wisper:' + json);
});

// Send a message!
bridge.notify('alert', [ 'Hello World!' ]);

```

#### Iframe Boundary
To communicate across an iframe boundary we use the `IframeBridge`, which sends JSON using `postMessage`.

```js
import { IframeBridge } from 'wisper-js';

// Get the iframe, and create the bridge.
const iframe = document.querySelector('iframe');
const bridge = new IframeBridge(iframe.contentWindow);

// Go ahead an invoke the remote functions using the `notify/invoke` methods.
bridge.invoke('add', [ 1, 2 ]).then( result => {
  assert.equal(result, 3);
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

#### Other
It's also possible to create your own Bridges by extending `BaseBridge`, and
implementing the `sendJSON` and `close` methods.
```js
import { BaseBridge } from 'wisper-js';
import $ from 'jquery';

class XHRBridge extends BaseBridge {
  constructor(url) {
    super();
    this.url = url;
  }

  sendJSON(json) {
    $.post(this.url, json);
  }

  // Prevent the bridge from being used further.
  // By default overrides `sendJSON` with a noop.
  close() {
    super.close();
  }
}

```

## The Bridge API
The Bridge API consists of three primary methods: [expose](#-expose-path-string-router-router-boolean-), [notify](#-notify-path-string-args-array-) and [invoke](#-invoke-path-string-args-array-promise-).

#### `expose(path: string, router: Router): boolean`
Expose a *route*

#### `notify(path: string, args?: Array)`

#### `invoke(path: string, args?: Array): Promise`
