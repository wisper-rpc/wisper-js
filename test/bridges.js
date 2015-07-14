import { BaseBridge, GlobalBridge } from '../src/bridges';

describe('BaseBridge', function () {
  const bridge = new BaseBridge();

  it('sends messages', function () {
    bridge.send = data => {
      expect(data).toEqual({
        method: 'some',
        params: [false]
      })
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

    expect(JSON.parse(lastJSON)).toEqual({
      method: 'method',
      params: [1, 2],
      id: 'base0'
    });
  });

  it('routes messages from the global receive function', function () {
    const sentMsg = { method: 'fn', params: [] };

    bridge.expose('fn', function (path, msg) {
      expect(path).toEqual('');
      expect(msg).toEqual(sentMsg);
    });

    window.globalReceive(JSON.stringify(sentMsg));
    // bridge.receive(sentMsg);
  });

  it('removes the function on close', function () {
    bridge.close();

    expect(window.globalReceive).toEqual(null);
  });
});
