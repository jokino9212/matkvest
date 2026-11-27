import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
export default defineConfig({plugins:[vue(),{name:'v307-account-offline-worker',generateBundle(){this.emitFile({type:'asset',fileName:'integrations/v307/account-offline-sw.js',source:readFileSync(resolve('integrations/v307/account-offline-sw.js'))})}}],base:'./',publicDir:false,build:{outDir:'dist-v307-review',emptyOutDir:true,rollupOptions:{input:{account:resolve('integrations/v307/account_review.html'),backup:resolve('integrations/v307/backup_review.html')}}}});
