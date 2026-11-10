/**
 * Blocking redirects a site to Five, which Chrome only allows on hosts the user has granted.
 * Five asks for each blocked site on its own instead of requesting every website at install.
 */

function permissionsApi(): typeof chrome.permissions | null {
  return typeof chrome !== 'undefined' && typeof chrome.permissions?.request === 'function' ? chrome.permissions : null;
}

/** `*.domain` also matches the bare domain, mirroring the `||domain^` blocking rule. */
export function siteOrigins(domains: string[]): string[] {
  return domains.map((domain) => `*://*.${domain}/*`);
}

/**
 * Must be called synchronously from a click or submit handler: Chrome rejects permission
 * requests that arrive after the user gesture has ended. Resolves true outside the extension.
 */
export function requestSiteAccess(domains: string[]): Promise<boolean> {
  const api = permissionsApi();
  if (!api || !domains.length) return Promise.resolve(true);
  return api.request({ origins: siteOrigins(domains) }).catch(() => false);
}

export function releaseSiteAccess(domain: string): void {
  void permissionsApi()?.remove({ origins: siteOrigins([domain]) }).catch(() => undefined);
}

export async function findSitesMissingAccess(domains: string[]): Promise<string[]> {
  const api = permissionsApi();
  if (!api) return [];
  const granted = await Promise.all(domains.map((domain) => api.contains({ origins: siteOrigins([domain]) }).catch(() => false)));
  return domains.filter((_, index) => !granted[index]);
}

export function watchSiteAccess(onChange: () => void): () => void {
  const api = permissionsApi();
  if (!api) return () => undefined;
  api.onAdded.addListener(onChange);
  api.onRemoved.addListener(onChange);
  return () => {
    api.onAdded.removeListener(onChange);
    api.onRemoved.removeListener(onChange);
  };
}
