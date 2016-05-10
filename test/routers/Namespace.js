import assert from 'assert';
import noop from 'lodash-es/noop';
import Namespace from '../../src/routers/Namespace.js';

function rejected( p ) {
  return p.then(
    () => { throw new Error( 'Promise should be rejected' ); },
    noop
  );
}

describe('Namespace', function () {
  const ns = new Namespace();

  const func = (path) => path + 2;

  const router = {
    route(path) {
      return path;
    }
  };


  it('is an ES6 class', function () {
    assert.throws(Namespace);
  });


  it('initially has no routes', function () {
    assert.equal(Object.keys(ns.routes).length, 0);
  });


  describe('.expose', function () {
    it('exposes Routers and RouteFunctions, returning true', function () {
      // Router
      assert.equal( ns.expose('router', router), true );

      // RouteFunction
      assert.equal( ns.expose('func', func), true );

      assert.equal( Object.keys(ns.routes).length, 2 );
    });

    it('cannot overwrite a router', function () {
      assert.equal( ns.expose('router', () => {}), false );
    });

    it('creates sub-namespaces for nested routes', function () {
      assert.equal( ns.expose('sub.func', func), true );
      assert.equal( Object.keys(ns.routes).length, 3 );

      assert.equal( ns.expose('sub.func2', func), true );
      assert.equal( Object.keys(ns.routes).length, 3 );
    });
  });


  describe('.route', function () {
    it('rejects empty paths', function () {
      return rejected( ns.route('', { method: 'some.', params: [] }) );
    });

    it('rejects paths without handlers', function () {
      return rejected( ns.route('no.thing', { method: 'no.thing', params: [] }) );
    });

    it('invokes eventual Router\'s route method', function () {
      assert.equal( ns.route('router.thing', { method: 'router.thing', params: [] }), 'thing' );
    });

    it('invokes eventual handler functions', function () {
      assert.equal( ns.route('func.thing', { method: 'func.thing', params: [] }), 'thing2' );
    });
  });
});
