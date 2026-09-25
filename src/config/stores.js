// src/config/stores.js

/**
 * Limpia la query para evitar textos repetidos y búsquedas demasiado largas
 */
function sanitizeQuery(rawQuery) {
  if (!rawQuery) return '';
  
  // Si la query es muy larga (ej. contiene repeticiones como MSI GeForce RTX 3060...), 
  // nos quedamos con las palabras clave principales.
  const clean = rawQuery.trim();
  
  // Elimina palabras duplicadas consecutivas o redundantes si las hubiera
  const words = clean.split(/\s+/);
  const uniqueWords = [...new Set(words)];
  
  // Limitamos a máximo 5 palabras principales para no saturar los buscadores
  return uniqueWords.slice(0, 5).join(' ');
}

/**
 * Genera la URL adecuada según la tienda y el término de búsqueda.
 */
function buildSearchUrl(storeId, rawQuery) {
  const query = sanitizeQuery(rawQuery);
  const queryEncoded = encodeURIComponent(query);
  const queryWithPlus = encodeURIComponent(query).replace(/%20/g, '+');

  switch (storeId) {
    // --- ESPAÑA ---
    case 'amazon_es':
      return `https://www.amazon.es/s?k=${queryEncoded}&tag=lidunax-21`;

    case 'pccomponentes':
      return `https://www.pccomponentes.com/buscar/?query=${queryEncoded}`;

    case 'coolmod':
      // Estructura oficial Doofinder de Coolmod con query limpia y signos +
      return `https://www.coolmod.com/#01cc/fullscreen/m=and&q=${queryWithPlus}`;

    // --- ESTADOS UNIDOS / GLOBAL ---
    case 'amazon_us':
    case 'amazon_global':
      return `https://www.amazon.com/s?k=${queryEncoded}&tag=lidunax-20`;

    case 'newegg_us':
    case 'newegg_global':
      return `https://www.newegg.com/p/pl?d=${queryEncoded}`;

    default:
      return `https://www.google.com/search?q=${queryEncoded}`;
  }
}

export const STORES_BY_LOCALE = {
  es: [
    {
      id: 'amazon_es',
      name: 'AMAZON ES',
      color: '#ff9900',
      bgClass: 'bg-[#141210]/90 hover:bg-[#1f1a15]',
      buildUrl: (query) => buildSearchUrl('amazon_es', query),
    },
    {
      id: 'pccomponentes',
      name: 'PCCOMPONENTES',
      color: '#ff6600',
      bgClass: 'bg-[#18120d]/90 hover:bg-[#241a12]',
      buildUrl: (query) => buildSearchUrl('pccomponentes', query),
    },
    {
      id: 'coolmod',
      name: 'COOLMOD',
      color: '#00bfff',
      bgClass: 'bg-[#0e111a]/90 hover:bg-[#131926]',
      buildUrl: (query) => buildSearchUrl('coolmod', query),
    },
  ],
  us: [
    {
      id: 'amazon_us',
      name: 'AMAZON US',
      color: '#ff9900',
      bgClass: 'bg-[#141210]/90 hover:bg-[#1f1a15]',
      buildUrl: (query) => buildSearchUrl('amazon_us', query),
    },
    {
      id: 'newegg_us',
      name: 'NEWEGG US',
      color: '#f38120',
      bgClass: 'bg-[#14100c]/90 hover:bg-[#211812]',
      buildUrl: (query) => buildSearchUrl('newegg_us', query),
    },
  ],
  global: [
    {
      id: 'amazon_global',
      name: 'AMAZON',
      color: '#ff9900',
      bgClass: 'bg-[#141210]/90 hover:bg-[#1f1a15]',
      buildUrl: (query) => buildSearchUrl('amazon_global', query),
    },
    {
      id: 'newegg_global',
      name: 'NEWEGG',
      color: '#f38120',
      bgClass: 'bg-[#14100c]/90 hover:bg-[#211812]',
      buildUrl: (query) => buildSearchUrl('newegg_global', query),
    },
  ],
};

export function getStoresForLocale(locale = 'es') {
  const normalizedLocale = locale.toLowerCase().split('-')[0];
  return STORES_BY_LOCALE[normalizedLocale] || STORES_BY_LOCALE.global;
}