import commonjs from '@rollup/plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import swc from 'rollup-plugin-swc';

export default {
  input: 'src/main.ts',
  output: [
    {
      file: 'dist/main.js',
      format: 'cjs',
      compact: true,
      exports: 'named',
    },
    {
      file: 'dist/main.esm.js',
      format: 'esm',
      compact: true,
      exports: 'named',
    },
  ],
  plugins: [
    peerDepsExternal(),
    commonjs(),
    swc({
      minify: true,
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        target: 'es2016',
        minify: {
          compress: true,
        },
      },
      sourceMaps: true,
    }),
  ],
};
