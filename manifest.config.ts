import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Five — a calmer focus list',
  short_name: 'Five',
  description: 'Keep five priorities in view, move the rest aside, and block distractions until the work is done.',
  version: '1.0.0',
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  permissions: ['alarms', 'declarativeNetRequestWithHostAccess', 'storage'],
  host_permissions: ['<all_urls>'],
  background: {
    service_worker: 'src/background/serviceWorker.ts',
    type: 'module',
  },
  chrome_url_overrides: {
    newtab: 'index.html',
  },
  action: {
    default_title: 'Open Five',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
    },
  },
});
