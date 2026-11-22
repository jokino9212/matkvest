import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  publicDir: false,
  build: {
    lib: {
      entry: fileURLToPath(new URL('./knowledge-map/mount.js', import.meta.url)),
      formats: ['es'],
      fileName: () => 'knowledge-map.js',
    },
    outDir: 'assets/ui',
    emptyOutDir: false,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        banner: '/*!\n' + readFileSync(new URL('../node_modules/vue/LICENSE', import.meta.url), 'utf8') + '\n*/',
      },
    },
  },
  esbuild: { legalComments: 'inline' },
});
