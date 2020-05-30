import typescript from 'rollup-plugin-typescript2'

const MAIN = 'src/index.ts';

export default [
  // ES5
  {
    input: MAIN,
    output: {
      file: 'dist/index.js',
      format: 'cjs',
    },
    plugins: [
      typescript({typescript: require('typescript')}),      
    ],
  },
];