import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'node:path';
// Isolated synthetic browser audit. Not included in the review artifact or production.
export default defineConfig({plugins:[vue()],base:'./',publicDir:false,build:{outDir:'dist-v307-encrypted-journals-audit',emptyOutDir:true,rollupOptions:{input:{audit:resolve('audits/fixtures/v307_encrypted_journals.html')}}}});
