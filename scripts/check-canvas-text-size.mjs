import { build } from 'vite'
import { readFileSync, readdirSync, rmSync, mkdirSync } from 'fs'
import { join } from 'path'
import { gzipSync } from 'zlib'

const outDir = 'dist-size-check'
const watch = process.argv.includes('--watch')

function printSizes() {
  const files = readdirSync(outDir).filter((f) => f.endsWith('.js'))
  const now = new Date().toLocaleTimeString()
  console.log(`\n📦 canvas-text 打包体积  [${now}]`)
  console.log('─'.repeat(52))
  for (const f of files.sort()) {
    const buf = readFileSync(join(outDir, f))
    const gzip = gzipSync(buf)
    const raw = (buf.length / 1024).toFixed(2).padStart(7)
    const gz = (gzip.length / 1024).toFixed(2).padStart(7)
    console.log(`  ${f.padEnd(28)} ${raw} KB  gzip ${gz} KB`)
  }
  console.log('─'.repeat(52))
  if (watch) console.log('👀 监听 src/canvas-text 变更中…\n')
}

async function run() {
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  await build({
    configFile: false,
    build: {
      lib: {
        entry: 'src/canvas-text/index.ts',
        name: 'CanvasText',
        formats: ['es', 'umd'],
        fileName: (format) => `canvas-text.${format}.js`,
      },
      outDir,
      emptyOutDir: true,
      minify: 'esbuild',
      watch: watch ? {} : null,
    },
    logLevel: watch ? 'warn' : 'info',
    plugins: watch
      ? [
          {
            name: 'report-size',
            closeBundle() {
              printSizes()
            },
          },
        ]
      : [],
  })

  if (!watch) printSizes()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
