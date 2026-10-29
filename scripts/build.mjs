// WordWise build script (esbuild).
//   node scripts/build.mjs            -> dist/ (index.html + assets/)
//   node scripts/build.mjs --single   -> dist-single/index.html (everything inlined, one file)
//   node scripts/build.mjs --artifact -> dist-artifact/index.html: a body fragment for hosts that supply their own
//                                         <html>/<head> wrapper (e.g. claude.ai Artifacts); inlines everything
//   node scripts/build.mjs --serve    -> dev server with live rebuild on http://localhost:5173
import * as esbuild from 'esbuild';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const artifact = args.has('--artifact');
const single = args.has('--single') || artifact;
const serve = args.has('--serve');
const outdir = resolve(root, artifact ? 'dist-artifact' : single ? 'dist-single' : 'dist');

const FONTS =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap';

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230d1424'/%3E%3Ctext x='32' y='43' font-family='Georgia,serif' font-size='34' font-weight='700' text-anchor='middle' fill='%23c9a96a'%3EW%3C/text%3E%3C/svg%3E";

function html({ css, js, linkCss, linkJs }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="color-scheme" content="dark light" />
<meta name="theme-color" content="#0d1424" />
<title>WordWise</title>
<meta name="description" content="WordWise — Find Words. Expand Your World. A word-search game for adults with built-in learning." />
<link rel="icon" href="${FAVICON}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${FONTS}" />
${linkCss ? `<link rel="stylesheet" href="${linkCss}" />` : `<style>${css}</style>`}
</head>
<body>
<div id="root"></div>
<noscript>WordWise needs JavaScript to run.</noscript>
${linkJs ? `<script src="${linkJs}"></script>` : `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`}
</body>
</html>
`;
}

const ARTIFACT_CSS = `
/* Hosted-page adjustments: the host pads the root by the phone's safe-area insets. */
:root { --safe-t: 0px; }
.topbar { top: env(safe-area-inset-top, 0px); }
.app { min-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); }
.app::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 30; background: var(--bg); }
`;

function fragment({ css, js }) {
  return `<title>WordWise</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${FONTS}" />
<style>${css}${ARTIFACT_CSS}</style>
<div id="root"></div>
<script>${js.replace(/<\/script/gi, '<\\/script')}</script>
`;
}

const common = {
  entryPoints: [resolve(root, 'src/main.tsx')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  loader: { '.css': 'css' },
  logLevel: 'info',
};

async function buildOnce() {
  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });
  const result = await esbuild.build({
    ...common,
    minify: !serve,
    sourcemap: serve ? 'inline' : false,
    define: { 'process.env.NODE_ENV': serve ? '"development"' : '"production"', __WW_EMBEDDED__: artifact ? 'true' : 'false' },
    outdir: resolve(outdir, 'assets'),
    entryNames: 'app',
    write: !single,
  });
  if (single) {
    const js = result.outputFiles.find((f) => f.path.endsWith('.js')).text;
    const cssFile = result.outputFiles.find((f) => f.path.endsWith('.css'));
    const parts = { js, css: cssFile ? cssFile.text : '' };
    await writeFile(resolve(outdir, 'index.html'), artifact ? fragment(parts) : html(parts));
  } else {
    await writeFile(resolve(outdir, 'index.html'), html({ linkCss: './assets/app.css', linkJs: './assets/app.js' }));
  }
  const size = (await readFile(resolve(outdir, 'index.html'))).length;
  console.log(`built ${artifact ? 'dist-artifact/index.html' : single ? 'dist-single/index.html' : 'dist/'} (index.html ${(size / 1024).toFixed(0)} KB)`);
}

if (serve) {
  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });
  await writeFile(resolve(outdir, 'index.html'), html({ linkCss: './assets/app.css', linkJs: './assets/app.js' }));
  const ctx = await esbuild.context({
    ...common,
    sourcemap: 'inline',
    define: { 'process.env.NODE_ENV': '"development"', __WW_EMBEDDED__: 'false' },
    outdir: resolve(outdir, 'assets'),
    entryNames: 'app',
  });
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: outdir, port: 5173 });
  console.log(`WordWise dev server: http://localhost:${port}`);
} else {
  await buildOnce();
}
