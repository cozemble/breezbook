import esbuild from 'esbuild'

esbuild
    .build({
        entryPoints: ['./src/index.ts'],
        bundle: true,
        platform: 'node',
        target: 'node18',
        minify: false,
        format: 'cjs',                   // Output format as CommonJS
        outfile: './dist/cjs/index.cjs'
    })
    .catch(() => process.exit(1))
