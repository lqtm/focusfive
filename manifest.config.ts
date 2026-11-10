import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Focus Five: New Tab To-Do List',
  short_name: 'Focus Five',
  description: 'Shows today’s five tasks on every new tab, with a focus timer and optional site blocking. Everything else waits in Later.',
  version: '1.7.1',
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
