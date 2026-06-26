const esbuild = require('esbuild');

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: process.argv.includes('--minify'),
    sourcemap: !process.argv.includes('--minify'),
    outfile: 'dist/extension.js',
    external: ['vscode'],
    platform: 'node',
    target: 'node22'
  });
  
  if (process.argv.includes('--watch')) {
    await ctx.watch();
    console.log('esbuild watching...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('esbuild compile completed.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
