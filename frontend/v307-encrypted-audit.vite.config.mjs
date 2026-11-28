import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'node:path';
// Separate audit-only output: never a rollup input of the regular review build.
export default defineConfig({plugins:[vue()],base:'./',publicDir:false,build:{outDir:'dist-v307-encrypted-audit',emptyOutDir:true,rollupOptions:{input:{audit:resolve('audits/fixtures/v307_encrypted_vue.html')}}}});
