import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import packageJson from '../package.json'
import * as path from 'path'

export default defineConfig({
  base: './',
  define: {
    __DATE__: `'${new Date().toISOString()}'`,
  },
  assetsInclude: [
    '**/*.glsl',
  ],
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, './src')}`,
    },
  },
  plugins: [
    createHtmlPlugin({
      minify: true,
      inject: {
        data: packageJson,
      },
    }),
  ],
})
