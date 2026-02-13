import esbuild from 'esbuild';

const isProd = process.env.NODE_ENV === 'production';

/**
 * We bundle only the scripts that affect the password modal first.
 * This dramatically improves TV browser compatibility by:
 * -避免多脚本加载/执行顺序差异
 * -将语法降级到较老的 target
 */
const entryPoints = {
  'index.bundle': 'js/index-entry.js',
  'player.bundle': 'js/player-entry.js',
  'watch.bundle': 'js/watch-entry.js',
};

await esbuild.build({
  entryPoints,
  outdir: 'js/built',
  bundle: true,
  format: 'iife',
  globalName: 'JiaJunApp',
  platform: 'browser',
  target: ['es2017'],
  sourcemap: isProd ? false : 'inline',
  minify: isProd,
  logLevel: 'info',
  // Keep original public paths as-is
  loader: {
    '.js': 'js',
  },
});

