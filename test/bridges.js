import assert from 'assert';
import { BaseBridge, PropertyBridge, IframeBridge } from '../src/bridges/index.js';

describe( 'BaseBridge', function () {
  const bridge = new BaseBridge();

  it( 'sends messages', function () {
    bridge.send = data => {
      assert.deepEqual( data, {
        method: 'some',
        params: [ false ],
      });
    };

    bridge.notify( 'some', [ false ] );
  });

  it( 'fixes result-responses where `result` is undefined', function () {
    const b = new BaseBridge();

    const promise = new Promise( resolve => b.sendJSON = resolve );

    b.sendResponse( 'foo', Promise.resolve( undefined ) );

    return promise.then( json => {
      assert.deepEqual( JSON.parse( json ), {
        id: 'foo',
        result: null,
      });
    });
  });
});


describe( 'PropertyBridge', function () {
  let bridge, lastJSON;
  const target = {};

  it( 'defines a receive function accessible at the global scope', function () {
    bridge = new PropertyBridge( target, 'globalReceive', ( json ) => {
      lastJSON = json;
    });

    assert.equal( bridge.receiveProperty, 'globalReceive' );
    assert.equal( typeof target.globalReceive, 'function' );
  });

  it( 'sends messages using the given send function', function () {
    bridge.invoke( 'method', [ 1, 2 ] );

    const msg = JSON.parse( lastJSON );

    assert.ok( msg.id.startsWith( 'PropertyBridge' ) );
    assert.equal( msg.method, 'method' );
    assert.deepEqual( msg.params, [ 1, 2 ] );

    bridge.notify( 'method', [ 3, 4 ] );

    assert.deepEqual( JSON.parse( lastJSON ), {
      method: 'method',
      params: [ 3, 4 ],
    });
  });

  it( 'routes messages from the global receive function', function () {
    const sentMsg = { method: 'fn', params: [] };

    bridge.expose( 'fn', function ( path, msg ) {
      assert.deepEqual( path, '' );
      assert.deepEqual( msg, sentMsg );
    });

    target.globalReceive( JSON.stringify( sentMsg ) );
  });

  it( 'removes the function on close', function () {
    bridge.close();

    assert.deepEqual( target.globalReceive, null );
  });
});


describe.skip( 'IframeBridge', function () {
  let bridge, lastArg;

  beforeEach( () => {
    // Route messages to my own window, i.e. to myself.
    bridge = new IframeBridge( window );
  });

  it( 'posts messages to the target window', function ( done ) {
    bridge.expose( 'self', function ( path, msg ) {
      lastArg = msg.params[ 0 ];
      done();
    });

    bridge.notify( 'self', [ 1 ] );
  });

  it( 'removes all event listeners on close', function ( done ) {
    bridge.close();
    bridge.notify( 'self', [ 2 ] );

    setTimeout( () => {
      assert.equal( lastArg, 1 );
      done();
    }, 20 );
  });
});
