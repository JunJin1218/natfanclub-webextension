import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    permissions: ['activeTab', 'tabs', 'storage'],
    host_permissions: [
      'https://natfanclub-backend-809989871890.asia-southeast1.run.app/*',
    ],
    web_accessible_resources: [
      {
        resources: ['icon/*', 'verification_icon/*'],
        matches: ['http://*/*', 'https://*/*'],
      },
    ],
  },
});
