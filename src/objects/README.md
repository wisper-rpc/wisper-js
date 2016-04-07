# Objects
Objects create a second level of abstraction on top of [Bridge](../bridges/)'s `notify` and `invoke`.

Objects can be created, destroyed, have their methods invoked and events dispatched.

## Remote
Instead of just invoking methods over a bridge, we can create objects. Objects whose implementation lie on the other side of the bridge are called `Remote` objects, because they are _remotely defined_.

##### Example: Using a remote object
Let's assume that we have a connection to some webserver that has exposed a WebPage class, that allows us to create webpages, set their contents, get its link and have it removed once the object is destroyed.

```js
// Creating the instance results in an asynchronous request being
// sent to instantiate it.
const page = new WebPage();

// We can set properties on the object immediately, as if it already exists.
// These will be deferred until a time that the object has been created on
// the remote end-point and an `id` returned.
page.contents = `<h1>My awesome WebPage!</h1>`;

// Get the dynamically generated link to the webpage and open it.
page.getLink().then( link => {
	const preview = window.open( link );

	// When we're done, destroy the remote object.
	preview.onbeforeunload = () => page.destroy();
});
```

We do require _some_ client-side implementation for this to work, but it's pretty straightforward.

##### Example: Remote definition

```js
import bridge from 'some-bridge';

import {
	interfaceName,
	properties,
	Remote,
	types,
} from 'wisper-js';

@interfaceName( bridge, 'path.to.the.WebPage' )
@properties({
	contents: types.string,
})
class WebPage extends Remote {
	getLink() {
		// FIXME: this isn't very convenient
		return this.bridge.invokeAsync( this.interfaceName + ':getLink' );
	}
}

```


## Local
A `Local` is just like a `Remote` except that the implementation is _locally defined_.

##### Example: Local definition
In this example we define a `Local` class called `Character`.

```js
import bridge from 'some-bridge';

import {
	interfaceName,
	Local,
	properties,
	types,
} from 'wisper-js';

// We expose the class through `bridge` under the given route.
// We can only expose a class through a single bridge.
@interfaceName( bridge, 'path.to.Character' )
@properties({
	// `Character` has a number property `level` initialized to `0`.
	level: types.number,
})
class Character extends Local {
	// The `constructor` is implicit in this case.

	levelUp() {
		// Since `level` is defined as a property, this will automatically
		// dispatch a `level` event over the bridge with the updated value.
		this.level++;

		// Does this under the hood:
		//   this.dispatch( 'level', this.level );
	}

	getAwesomeLevelDescription() {
		// This will be sent across the bridge as a response to the method call.
		return `I'm already level ${ this.level }! :D`;
	}

	dispatchEventOverBridge() {
		// Manually dispatch an event with name `eventName` and `value`.
		this.dispatch( 'eventName', value );
	}
}
```
