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
};
