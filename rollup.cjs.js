import config from './rollup.es6.js';

config.format = 'cjs';
config.dest = config.dest.replace( 'es6', 'cjs' );

export default config;
