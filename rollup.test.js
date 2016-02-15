import config from './rollup.cjs.js';

config.external.push( 'assert' );

config.entry = 'test/test.js';
config.dest = 'tmp/test.js';

export default config;
