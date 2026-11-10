import { useEffect, useState } from 'react';

import { findSitesMissingAccess, watchSiteAccess } from '../data/siteAccess';

/** Blocklist entries Chrome has not granted yet, so they would not actually be blocked. */
export function useSitesMissingAccess(sites: string[]): string[] {
  const [missing, setMissing] = useState<string[]>([]);
  const key = sites.join('\n');

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void findSitesMissingAccess(key ? key.split('\n') : []).then((result) => {
        if (active) setMissing(result);
      });
    };
    refresh();
    const stop = watchSiteAccess(refresh);
    return () => {
      active = false;
      stop();
    };
  }, [key]);

  return missing;
}
