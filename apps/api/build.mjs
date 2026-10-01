// Bundles the API into one ESM file. Workspace packages (@salary/*) ship as
// TypeScript source, so they are bundled in; everything from npm stays external
// and is installed normally on the server.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/server.ts'],
  outfile: 'dist/server.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  plugins: [
    {
      name: 'externalize-npm-packages',
      setup(b) {
        b.onResolve({ filter: /^[^./]/ }, (args) =>
          args.path.startsWith('@salary/') ? undefined : { path: args.path, external: true },
        );
      },
    },
  ],
});
