//import babel from 'rollup-plugin-babel';
import buble from 'rollup-plugin-buble';
import resolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/main.js',
  dest: 'dist/wisper.es6.js',
  format: "es6",
  plugins: [
    buble(),
    resolve(),
  ],
};
