import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'wisper.js',
  dest: 'dist/wisper.es6.js',

  plugins: [
    babel({
      babelrc: false,
      presets: [
        'es2015-rollup',
      ],
    }),
    resolve(),
  ],
};
