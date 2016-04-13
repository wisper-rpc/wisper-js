# wisper-js changelog

## master

## 0.2.2
* If `result` is `undefined` when sending a result-response an invalid message will be generated (`JSON.stringify` removes object keys with undefined values). This is solved by setting result to `null`.

## 0.2.1
* Fix bug where writing to a RemoteObject's `readonly` property threw `TypeError`
* Added `postinstall` hook; should be removed once our workflow allows it

## 0.2.0
* Renamed `GlobalBridge` (which depended on `window`) to `PropertyBridge`, with no global dependencies.
* Build using Rollup instead of Browserify
* Use `lodash-es@4` instead of `lodash@3`

## 0.1.0
* Initial release
