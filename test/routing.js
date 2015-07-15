import { Namespace } from '../src/routing';

describe('Namespace', function () {
  const ns = new Namespace();

  const func = (path, msg) => path + 2;

  const router = {
    route(path, msg) {
      return path;
    }
  };


  it('initially has no routes', function () {
    expect(Object.keys(ns.routes).length).toBe(0);
  });


  describe('.expose', function () {
    it('exposes Routers and RouteFunctions, returning true', function () {
      // Router
      expect(ns.expose('router', router)).toBe(true);

      // RouteFunction
      expect(ns.expose('func', func)).toBe(true);

      expect(Object.keys(ns.routes).length).toBe(2);
    });

    it('cannot overwrite a router', function () {
      expect(ns.expose('router', () => {})).toBe(false);
    });

    it('creates sub-namespaces for nested routes', function () {
      expect(ns.expose('sub.func', func)).toBe(true);
      expect(Object.keys(ns.routes).length).toBe(3);

      expect(ns.expose('sub.func2', func)).toBe(true);
      expect(Object.keys(ns.routes).length).toBe(3);
    });
  });


  describe('.route', function () {
    it('rejects empty paths', function (done) {
      ns.route('', { method: 'some.', params: [] }).then(fail, done);
    });

    it('rejects paths without handlers', function (done) {
      ns.route('no.thing', { method: 'no.thing', params: [] }).then(fail, done);
    });

    it('invokes eventual Router\'s route method', function () {
      expect(ns.route('router.thing', { method: 'router.thing', params: [] })).toBe('thing');
    });

    it('invokes eventual handler functions', function () {
      expect(ns.route('func.thing', { method: 'func.thing', params: [] })).toBe('thing2');
    });
  });
});
