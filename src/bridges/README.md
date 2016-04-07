# Bridges
A `Bridge` lies at the outmost edge of a Wisper system. It receives incoming messages through `.receiveJSON` method, and sends messages through `.sendJSON` method.

Incoming messages will either be sent to a [Router](../routers/), or used as the response to a request.

```
receiveJSON +---------+      +--------+
    <---    | Bridge  | ---> | Router |
    --->    +---------+      +--------+
  sendJSON  | +invoke |
            | +notify |
            +---------+
                 |
                 v
            +----------+
            | Waiting  |
            | Requests |
            +----------+
```

## API
Let's have a look at the API of a `Bridge`.

### sendJSON( string )
At the very base lies the `sendJSON` method, which should send the given JSON-formatted string somewhere. This is really just an implementation detail, we won't be using it much.

### send( message )
Structured messages can be sent through the bridge using the `send` method. Just construct the message and let send to the rest. You'll have to manually construct the message yourself; which can get rather tedious.

##### Example
```js
bridge.send({ method: 'add', params: [ 1, 2 ] });
	// bridge.sendJSON('{"method":"add","params":[1,2]}');
```

### notify( method, parameters=[] )
You can opt to use `notify`, which creates a message and calls `send` for you, with the `method` name and the `parameters` you want to call the method with.

##### Example
```js
bridge.notify( 'foo' );
	// => bridge.send({ method: 'foo', params: [] })

bridge.notify( 'bar', [ 1, 2 ] );
	// => bridge.send({ method: 'bar', params: [ 1, 2 ] })
```

The only problem with calling a remote method with `notify` is that often, you might want to get a response.

### invoke( method, params=[] )
Calling `invoke` works a lot like calling `notify` except that it returns a Promise that will get resolved or rejected depending on the result of the invocation. The Bridge will create a unique `id` for the given request and store it in a map of requests waiting for responses.

The returned Promise will be resolved or rejected once the Bridge receives a response message with an `id` matching that of the request.

##### Example
```js
bridge.invoke( 'foo' ).then( result => ... );
	// => bridge.send({ method: 'foo', params: [], id: ?? })
```

### async variations
Both `notify` and `invoke` have asynchronous variations called `notifyAsync` and `invokeAsync`, that work just like the first two, except that they allow for parameters to be Promises, which they await before making the call.

##### Example
```js
// We invoke a remote `add` implementation to sum two numbers.
const addResult = bridge.invoke( 'add', [ 1, 2 ] );

// Then we notify the remote of the result of the operation.
bridge.notifyAsync( 'the-result-was', [ addResult ] );
```

### expose( path, router )
What about incoming messages, that aren't responses to an `invoke` call? We'll have to pass them to some function that can handle the message, and optionally send a response. In designing Wisper we've opted to use [routers](../routers/) for this purpose.

##### Example
```js
bridge.expose( 'my.interesting.path', router );
```

## Specialized Bridges
`BaseBridge` provides a complete Bridge implementation except for the `sendJSON` method, which is left unimplemented. The `IframeBridge` makes it easy to communicate across window boundaries by filling in `BaseBridge`'s blanks using `postMessage` and `message` event listeners.

##### Example
```js
// Create a bridge that sends messages to the parent of the current window.
const bridge = new IframeBridge( window.parent );

// Request that the parent window resize the iframe.
bridge.invoke( 'resize', [{ width: 300, height: 600 }] ).then( () => {
	// Success!
}, err => {
	// Print what went wrong.
	console.error( err.message );
});
```

> NOTE: The following documentation doesn't apply until BaseBridge has been made usable by taking a `send` function as a constructor parameter.

The `BaseBridge` easily be used on its own to, for example, communicate over a websocket.

##### Example
```js
// Create a socket.
const socket = new WebSocket( hostUrl );

// Create a new Bridge that sends JSON through the socket.
const bridge = new BaseBridge( json => socket.send( json ) );

// Redirect all incoming messages from the socket to the bridge.
socket.onmessage = json => bridge.receiveJSON( json );
```

This setup code could be used to create a `WebSocketBridge`, but it isn't required to use a bridge.

#### LoopbackBridge
One fun experiment you can create is that of a loopback bridge; a bridge that sends all messages back to itself. Pretty crazy, eh?

```js
const bridge = new BaseBridge( json => bridge.receiveJSON( json ) );

// Expose some router to test
bridge.expose( 'path', someRouter );

// Invoke a method managed by the router to test it.
bridge.invoke( 'path.foo' ).then( result => ... );
```
