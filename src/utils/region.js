// src/utils/region.js
// Detección ligera de región SIN peticiones de red (sin APIs de IP de terceros):
// usa la zona horaria del navegador, que es instantánea y no expone datos personales.
// Devuelve 'US' solo para visitantes de EE.UU.; el resto (España/Europa/otros) -> 'ES'.

const US_TZ = /^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Sitka|Nome|Yakutat|Metlakatla|Adak|Menominee|North_Dakota\/.+|Indiana\/.+|Kentucky\/.+)|US\/.+|Pacific\/Honolulu)$/;

const STORAGE_KEY = 'lidunax_region';

export function detectRegion() {
  if (typeof window === 'undefined') return 'ES';

  // Override manual para QA: ?region=us | ?region=es
  try {
    const forced = new URLSearchParams(window.location.search).get('region')?.toUpperCase();
    if (forced === 'US' || forced === 'ES') return forced;
  } catch { /* ignore */ }

  try {
    const cached = window.sessionStorage.getItem(STORAGE_KEY);
    if (cached === 'US' || cached === 'ES') return cached;
  } catch { /* storage bloqueado */ }

  let region = 'ES';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (US_TZ.test(tz)) region = 'US';
  } catch { /* Intl no disponible */ }

  try { window.sessionStorage.setItem(STORAGE_KEY, region); } catch { /* ignore */ }
  return region;
}
