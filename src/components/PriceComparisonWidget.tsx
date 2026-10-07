// src/components/PriceComparisonWidget.tsx
// Comparador táctico: oferta principal + variantes/modelos similares + alerta de precio.
//
// IMPORTANTE (datos):
//  - Lidunax no tiene feed de precios. El widget NUNCA inventa importes: el precio de cada variante
//    es opcional (`price`). Si no se pasa, la fila muestra "VER PRECIO ↗" y enlaza a la tienda.
//  - Si pasas precios reales (p. ej. desde la Product Advertising API), pasa también `priceUpdatedAt`
//    para mostrar la fecha/hora de la consulta (Amazon lo exige al mostrar precios).
//  - La alerta de precio necesita un backend: sin `alertEndpoint` ni `onSubscribe` el botón no se muestra.
import React, { useMemo } from 'react';
import { AmazonLogo, ChipIcon } from './AmazonButton';
import { PriceAlert, DEFAULT_ALERT_ENDPOINT, type AlertPayload } from './PriceAlert';
import { useRegion } from './SmartAffiliateCTA';
import { getAffiliateUrl, sanitizeQuery, STORES } from '../config/stores.js';

export interface PriceVariant {
  /** Badge técnico en píldora: "1TB", "VRAM 16GB"... */
  badge: string;
  /** Nombre corto de la variante. */
  name: string;
  /** Búsqueda en tienda (por defecto, `name`). */
  query?: string;
  /** Precio ya formateado ("129,99 €"). Opcional: no se inventa. */
  price?: string;
  /** Precio numérico para ordenar de menor a mayor (opcional). */
  priceValue?: number;
}

export type { AlertPayload };

interface PriceComparisonWidgetProps {
  /** Nombre completo del producto seleccionado. */
  productName: string;
  /** Búsqueda de la oferta principal (por defecto, `productName`). */
  query?: string;
  /** 2-3 alternativas / variantes. */
  variants?: PriceVariant[];
  isEn?: boolean;
  /** Fecha/hora de los precios mostrados (texto ya formateado). */
  priceUpdatedAt?: string;
  /** URL POST (JSON) que recibe `AlertPayload`. Sin ella (ni `onSubscribe`) no se muestra la alerta. */
  alertEndpoint?: string;
  /** Alternativa programática al endpoint. Debe lanzar si falla. */
  onSubscribe?: (payload: AlertPayload) => Promise<void>;
  /** Ruta de la política de privacidad para el consentimiento. */
  privacyHref?: string;
  className?: string;
}

const REL = 'nofollow sponsored noopener noreferrer';

const ArrowUpRight = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M7 17L17 7" />
    <path d="M8.5 7H17v8.5" />
  </svg>
);

const STORE_BTN =
  'inline-flex items-center justify-center gap-1.5 shrink-0 min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-mono font-bold tracking-wide uppercase cursor-pointer ' +
  'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 hover:border-amber-400 transition-colors duration-200 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60';

export const PriceComparisonWidget: React.FC<PriceComparisonWidgetProps> = ({
  productName,
  query,
  variants = [],
  isEn = false,
  priceUpdatedAt,
  alertEndpoint,
  onSubscribe,
  privacyHref = '/privacidad',
  className = '',
}) => {
  const region = useRegion();
  const isUS = region === 'US';
  const t = (en: string, es: string) => (isEn ? en : es);

  const mainQuery = query ?? productName;
  const primaryStore = isUS ? STORES.AMAZON_US : STORES.AMAZON_ES;
  const primaryName = isUS ? 'Amazon US' : 'Amazon';

  // Orden: si hay precios numéricos, de menor a mayor (los que no tienen precio, al final); si no, el orden recibido.
  const rows = useMemo(() => {
    const list = variants.slice(0, 3);
    if (!list.some((v) => typeof v.priceValue === 'number')) return list;
    return [...list].sort((a, b) => (a.priceValue ?? Infinity) - (b.priceValue ?? Infinity));
  }, [variants]);
  const hasPrices = rows.some((v) => v.price);
  const hasSort = rows.some((v) => typeof v.priceValue === 'number');

  return (
    <section
      className={`bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 md:p-6 space-y-3 shadow-xl ${className}`}
      aria-label={t('Best price and available variants', 'Mejor precio y variantes disponibles')}
    >
      {/* 1. CABECERA */}
      <header className="border-b border-zinc-800/60 pb-3">
        <h3 className="font-orbitron text-xs font-semibold tracking-[0.18em] uppercase text-[#FFC21A]">
          {t('BEST PRICE & AVAILABLE VARIANTS', 'MEJOR PRECIO Y VARIANTES DISPONIBLES')}
        </h3>
        <p className="mt-1.5 text-sm md:text-base font-medium text-zinc-100 leading-snug">{productName}</p>
      </header>

      {/* 2. OFERTA PRINCIPAL */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 md:p-3.5 shadow-[0_0_14px_rgba(245,158,11,0.08)]">
        <div className="flex items-center gap-3 flex-1 min-w-[10rem]">
          <AmazonLogo className="h-7 w-7 shrink-0 text-amber-400" />
          <span className="min-w-0 truncate text-sm font-medium text-zinc-100" title={productName}>
            {sanitizeQuery(productName)}
          </span>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <a
            href={getAffiliateUrl(primaryStore, mainQuery)}
            target="_blank"
            rel={REL}
            aria-label={`${productName} ${primaryName}`}
            className={STORE_BTN}
          >
            <span>{t(`View on ${primaryName}`, `Ver en ${primaryName}`)}</span>
            <ArrowUpRight />
          </a>
          {isUS && (
            <a
              href={getAffiliateUrl(STORES.NEWEGG, mainQuery)}
              target="_blank"
              rel={REL}
              aria-label={`${productName} Newegg`}
              className={STORE_BTN}
            >
              <ChipIcon className="h-4 w-4" />
              <span>Newegg</span>
              <ArrowUpRight />
            </a>
          )}
        </div>
      </div>

      {/* 3. VARIANTES */}
      {rows.length > 0 && (
        <ul className="m-0 list-none p-0">
          {rows.map((v, i) => (
            <li key={`${v.badge}-${v.name}`} className={i < rows.length - 1 ? 'border-b border-zinc-800/60' : ''}>
              <a
                href={getAffiliateUrl(primaryStore, v.query ?? v.name)}
                target="_blank"
                rel={REL}
                aria-label={`${v.name} ${primaryName}`}
                className="group flex items-center gap-3 py-3 rounded-lg transition-colors duration-200 hover:bg-zinc-900/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
              >
                <AmazonLogo className="h-5 w-5 shrink-0 text-amber-400/80" />
                <span className="shrink-0 px-2.5 py-1 text-[10px] font-mono font-bold tracking-widest uppercase rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                  {v.badge}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs md:text-sm text-zinc-300" title={v.name}>
                  {t('Similar model / variant', 'Modelo similar / variante')} · {v.name}
                </span>
                {v.price ? (
                  <span className="shrink-0 font-mono text-sm text-zinc-100 font-bold">{v.price}</span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-wide text-amber-400/80 group-hover:text-amber-400">
                    {t('See price', 'Ver precio')}
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* 4. ALERTA DE PRECIO (solo si hay backend configurado) */}
      <PriceAlert product={productName} region={region} isEn={isEn} theme="dark" endpoint={alertEndpoint ?? DEFAULT_ALERT_ENDPOINT} onSubscribe={onSubscribe} privacyHref={privacyHref} />

      {/* 5. FOOTER TRANSPARENTE */}
      <footer className="space-y-1 pt-1">
        {hasPrices && priceUpdatedAt && (
          <p className="text-[11px] text-zinc-500 font-mono">
            {t('Prices checked', 'Precios consultados')}: {priceUpdatedAt}
          </p>
        )}
        <p className="text-[11px] leading-snug text-zinc-500 font-mono">
          {hasSort ? t('Sorted by price. ', 'Ordenado por precio. ') : ''}
          {t(
            'As an Amazon affiliate and partner stores, we earn from qualifying purchases.',
            'Como afiliados de Amazon y tiendas asociadas, percibimos ingresos por las compras adscritas que cumplen los requisitos aplicables.'
          )}
        </p>
      </footer>
    </section>
  );
};

export default PriceComparisonWidget;
