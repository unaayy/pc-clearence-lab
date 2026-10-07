// src/config/stores.js
// Helper único de afiliación. Toda URL monetizada de Lidunax se genera aquí.
//
// Tiendas soportadas:
//   - amazon_es : Amazon España (tag de afiliado propio)         -> tráfico ES / Europa
//   - amazon_us : Amazon EE.UU. (tag de afiliado US)             -> tráfico US
//   - newegg    : Newegg vía Rakuten LinkSynergy (deep link)     -> tráfico US

export const AMAZON_TAG = 'lidunax-21';

// Amazon US exige un tag de Associates propio (cuenta distinta a la de EU).
// Defínelo en .env como PUBLIC_AMAZON_US_TAG; mientras tanto reutiliza el tag ES
// para que el enlace funcione (sin comisión US hasta configurarlo).
export const AMAZON_US_TAG = import.meta.env?.PUBLIC_AMAZON_US_TAG || AMAZON_TAG;

// Rakuten LinkSynergy / Newegg
export const LINKSYNERGY_ID = 'A3wZBoimtWM';
export const NEWEGG_MID = '44583';

export const STORES = Object.freeze({
  AMAZON_ES: 'amazon_es',
  AMAZON_US: 'amazon_us',
  NEWEGG: 'newegg',
});

/**
 * Limpia la query: elimina palabras duplicadas y limita la longitud
 * para evitar búsquedas saturadas (p. ej. "MSI GeForce RTX 3060 MSI GeForce...").
 */
export function sanitizeQuery(rawQuery) {
  if (!rawQuery) return '';
  const words = String(rawQuery).trim().split(/\s+/).filter(Boolean);
  const uniqueWords = [...new Set(words)];
  // 8 palabras: suficiente para "ASUS ROG Strix GeForce RTX 4090 OC Edition" sin cortar el modelo
  return uniqueWords.slice(0, 8).join(' ');
}

const builders = {
  [STORES.AMAZON_ES]: (q) =>
    `https://www.amazon.es/s?k=${encodeURIComponent(q)}&tag=${encodeURIComponent(AMAZON_TAG)}`,

  [STORES.AMAZON_US]: (q) =>
    `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${encodeURIComponent(AMAZON_US_TAG)}`,

  // La query se codifica dentro de la URL de Newegg (para que & # + no la rompan)
  // y la URL completa se vuelve a codificar como parámetro `murl` del deep link.
  [STORES.NEWEGG]: (q) =>
    `https://click.linksynergy.com/deeplink?id=${LINKSYNERGY_ID}&mid=${NEWEGG_MID}&murl=${encodeURIComponent(
      'https://www.newegg.com/p/pl?d=' + encodeURIComponent(q)
    )}`,
};

/**
 * Devuelve la URL de afiliado de una tienda para una búsqueda.
 * @param {'amazon_es'|'amazon_us'|'newegg'} store
 * @param {string} searchQuery
 * @returns {string} URL o '#' si la tienda/query no son válidas.
 */
export function getAffiliateUrl(store, searchQuery) {
  const build = builders[store];
  const query = sanitizeQuery(searchQuery);
  if (!build || !query) return '#';
  return build(query);
}
