import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

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
    typescript({
      tsconfig: './tsconfig.json',
    }),
  ],
};
