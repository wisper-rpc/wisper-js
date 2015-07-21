import { BaseBridge, GlobalBridge, IframeBridge } from '../src/bridges';

describe('BaseBridge', function () {
  const bridge = new BaseBridge();

  it('sends messages', function () {
    bridge.send = data => {
      expect(data).toEqual({
        method: 'some',
        params: [false]
      });
    };

    bridge.notify('some', [false]);
  });
});


describe('GlobalBridge', function () {
  let bridge, lastJSON;

  it('defines a receive function accessible at the global scope', function () {
    bridge = new GlobalBridge('globalReceive', (json) => {
      lastJSON = json;
    });

    expect(bridge.receiveProperty).toEqual('globalReceive');
    expect(typeof window.globalReceive).toEqual('function');
  });

  it('sends messages using the given send function', function () {
    bridge.invoke('method', [1, 2]);

    const msg = JSON.parse(lastJSON);

    expect(msg.id.startsWith('GlobalBridge')).toBeTruthy();
    expect(msg.method).toEqual('method');
    expect(msg.params).toEqual([1, 2]);

    bridge.notify('method', [3, 4]);

    expect(JSON.parse(lastJSON)).toEqual({
      method: 'method',
      params: [3, 4]
    });
  });

  it('routes messages from the global receive function', function () {
    const sentMsg = { method: 'fn', params: [] };

    bridge.expose('fn', function (path, msg) {
      expect(path).toEqual('');
      expect(msg).toEqual(sentMsg);
    });

    window.globalReceive(JSON.stringify(sentMsg));
  });

  it('removes the function on close', function () {
    bridge.close();

    expect(window.globalReceive).toEqual(null);
  });
});


describe('IframeBridge', function () {
  // Route messages to my own window, i.e. to myself.
  const bridge = new IframeBridge(window);
  let lastArg;

  it('posts messages to the target window', function (done) {
    bridge.expose('self', function (path, msg) {
      lastArg = msg.params[0];
      done();
    });

    bridge.notify('self', [1]);
  });

  it('removes all event listeners on close', function (done) {
    bridge.close();
    bridge.notify('self', [2]);

    setTimeout(() => {
      expect(lastArg).toBe(1);
      done();
    }, 20);
  });
});
