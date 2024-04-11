import esbuild from 'esbuild'

esbuild
  .build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: './dist/index.js',
    minify: false,
  })
  .catch(() => process.exit(1))
