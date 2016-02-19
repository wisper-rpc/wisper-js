# wisper-js changelog

* Fix bug where writing to a RemoteObject's `readonly` property threw `TypeError`

## 0.2.0
* Renamed `GlobalBridge` (which depended on `window`) to `PropertyBridge`, with no global dependencies.
* Build using Rollup instead of Browserify
* Use `lodash-es@4` instead of `lodash@3`

## 0.1.0
* Initial release
