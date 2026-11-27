import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'node:path';
export default defineConfig({plugins:[vue()],base:'./',publicDir:false,build:{outDir:'dist-v307-review',emptyOutDir:true,rollupOptions:{input:{account:resolve('integrations/v307/account_review.html'),backup:resolve('integrations/v307/backup_review.html')}}}});
