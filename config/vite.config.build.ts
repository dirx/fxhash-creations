import { defineConfig, mergeConfig } from 'vite'
import packageJson from '../package.json'
import rollupPluginLicense from 'rollup-plugin-license'
import viteConfig from './vite.config.js'
import zipPack from 'vite-plugin-zip-pack'
import * as path from 'path'
import { additionalDependencies } from './additional-dependencies'

const comment = `
${packageJson.config.title}

${packageJson.description}
${packageJson.config.additionalDescription}

${packageJson.author.name}, ${packageJson.author.url}
`

export default mergeConfig(
  viteConfig,
  defineConfig({
    esbuild: {
      pure: ['console.debug', 'console.log', 'console.warn'],
    },
    build: {
      minify: true,
      emptyOutDir: true,
      sourcemap: false,
      assetsDir: './',
      rollupOptions: {
        output: {
          entryFileNames: `[name].js`,
          chunkFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`,
        },
      },
    },
    plugins: [
      rollupPluginLicense({
        banner: {
          commentStyle: 'ignored', // The default
          content: comment,
        },
        thirdParty: {
          includePrivate: false,
          multipleVersions: true,
          output: {
            file: path.join(__dirname, '../dist', 'licenses.txt'),
            encoding: 'utf-8',
            template: (dependencies) => {
              let ds = dependencies.map((d) => d.text())
              ds.push(...additionalDependencies)
              return ds.length > 0 ? ds.join(`\n\n---\n\n`) : 'No third parties dependencies'
            },
          },
        },
      }),
      zipPack({
        filter: (fileName) => {
          return !['.DS_Store', '.test'].includes(fileName)
        },
        outDir: 'dist-zipped',
        outFileName: 'project.zip',
      }),
    ],
  }),
)
