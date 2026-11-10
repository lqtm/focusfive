import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Focus Five — a calmer focus list',
  short_name: 'Focus Five',
  description: 'Keep five priorities in view, move the rest aside, and block distractions until the work is done.',
  version: '1.7.0',
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  permissions: ['alarms', 'declarativeNetRequestWithHostAccess', 'storage'],
  optional_host_permissions: ['*://*/*'],
  background: {
    service_worker: 'src/background/serviceWorker.ts',
    type: 'module',
  },
  web_accessible_resources: [{
    resources: ['index.html'],
    matches: ['<all_urls>'],
    use_dynamic_url: true,
  }],
  chrome_url_overrides: {
    newtab: 'index.html',
  },
  action: {
    default_title: 'Open Focus Five',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
    },
  },
});
