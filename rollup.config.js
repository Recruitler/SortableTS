import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/sortablets.min.js',
      format: 'umd',
      name: 'SortableTS',
      sourcemap: true,
      plugins: [terser()]
    },
    {
      file: 'dist/sortablets.js',
      format: 'umd',
      name: 'SortableTS',
      sourcemap: true
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist/types'
    })
  ]
};
