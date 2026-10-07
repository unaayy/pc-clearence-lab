// src/components/SmartAffiliateCTA.tsx
// CTA de afiliación unificado:
//   - Visitas ES / Europa / resto -> Amazon ES
//   - Visitas US                  -> Amazon US + Newegg
// Se renderiza con Amazon ES en SSR y se ajusta en cliente tras detectar la región.
import React, { useEffect, useState } from 'react';
import { AmazonButton, NeweggButton, TrustNote } from './AmazonButton';
import { PriceAlert, DEFAULT_ALERT_ENDPOINT, type AlertPayload } from './PriceAlert';
import { getAffiliateUrl, sanitizeQuery, STORES } from '../config/stores.js';
import { detectRegion } from '../utils/region.js';

export type Region = 'ES' | 'US';

export function useRegion(): Region {
  const [region, setRegion] = useState<Region>('ES');
  useEffect(() => {
    setRegion(detectRegion() as Region);
  }, []);
  return region;
}

export type StockStatus = 'in_stock' | 'available' | 'low_stock' | 'out_of_stock' | 'unknown';

/** Datos comerciales opcionales (reales). Si faltan no se inventa nada: "Consultar oferta" + "Verificar disponibilidad". */
export interface OfferInfo {
  /** Precio exacto ya formateado ("89,90 €"). */
  price?: string;
  /** Precio base de un rango/variantes ya formateado ("89,90 €") -> se muestra "Desde 89,90 €". */
  priceFrom?: string;
  stockStatus?: StockStatus;
  /** Unidades; < 5 (y > 0) se trata como "Pocas Unidades", 0 como agotado. */
  stock?: number;
}

/** Variante alternativa (1TB / 2TB, ensamblador similar...) que se muestra bajo el componente principal. */
export interface AffiliateVariant extends OfferInfo {
  /** Píldora técnica: "2TB", "VRAM 16GB"... */
  badge: string;
  name: string;
  /** Búsqueda en tienda (por defecto, `name`). */
  query?: string;
}

/** Componente de un análisis (CPU, GPU, AIO, PSU, CASE...) con su búsqueda de tienda. */
export interface AffiliateItem extends OfferInfo {
  /** Etiqueta del badge: CPU, GPU, AIO, PSU, CASE... */
  type: string;
  /** Nombre completo del componente (se limpia para mostrarlo y se usa como búsqueda). */
  name: string;
  variants?: AffiliateVariant[];
}

interface SmartAffiliateCTAProps {
  /** Búsqueda del producto (se sanitiza y codifica en el helper de afiliados). Ignorada si hay `items`. */
  query?: string;
  /** Todos los componentes del análisis: genera una fila de compra por cada uno (variant 'box'). */
  items?: AffiliateItem[];
  isEn?: boolean;
  /**
   * 'full'    = megabotón(es) a ancho completo (por defecto)
   * 'compact' = botones en línea para filas de listas
   * 'light'   = botón(es) de compra para filas del bloque blanco ("AMAZON ES ↗" / "AMAZON US ↗" + "NEWEGG ↗")
   * 'box'     = contenedor claro con título (un botón, o una fila por componente si hay `items`)
   */
  variant?: 'full' | 'compact' | 'box' | 'light';
  /** Título del contenedor (solo variant 'box'). */
  title?: string;
  /** Fecha/hora de los precios mostrados (solo si pasas `price` reales). */
  priceUpdatedAt?: string;
  /** Endpoint POST de alertas de precio (o PUBLIC_PRICE_ALERT_ENDPOINT). Sin backend no se muestra la alerta. */
  alertEndpoint?: string;
  onSubscribe?: (payload: AlertPayload) => Promise<void>;
  className?: string;
}

/** Botones de tienda para una búsqueda según la región. */
function StoreLinks({
  query,
  isUS,
  isEn,
  variant,
}: {
  query: string;
  isUS: boolean;
  isEn: boolean;
  variant: 'full' | 'compact' | 'chip';
}) {
  if (isUS) {
    return (
      <>
        <AmazonButton
          market="US"
          variant={variant}
          isEn={isEn}
          showTrust={false}
          href={getAffiliateUrl(STORES.AMAZON_US, query)}
          ariaLabel={`${query} Amazon US`}
        />
        <NeweggButton
          variant={variant}
          isEn={isEn}
          href={getAffiliateUrl(STORES.NEWEGG, query)}
          ariaLabel={`${query} Newegg`}
        />
      </>
    );
  }
  return (
    <AmazonButton
      market="ES"
      variant={variant}
      isEn={isEn}
      href={getAffiliateUrl(STORES.AMAZON_ES, query)}
      ariaLabel={`${query} Amazon ES`}
    />
  );
}

const REL = 'nofollow sponsored noopener noreferrer';

const ArrowUpRight = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M7 17L17 7" />
    <path d="M8.5 7H17v8.5" />
  </svg>
);

const LIGHT_BTN =
  'bg-[#FF9900] hover:bg-[#FF8A00] text-zinc-950 font-bold text-xs px-3.5 py-2 min-h-[36px] rounded-lg flex items-center gap-1 shrink-0 shadow-sm transition-all hover:scale-[1.02] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 motion-reduce:transition-none motion-reduce:hover:scale-100';

/** Botones de compra para el bloque claro: "Ver en Amazon ↗" (ES) o Amazon US + "Newegg ↗" (US). */
function LightStoreButtons({ query, isUS, isEn }: { query: string; isUS: boolean; isEn: boolean }) {
  const view = isEn ? 'View on' : 'Ver en';
  return (
    <>
      <a
        href={getAffiliateUrl(isUS ? STORES.AMAZON_US : STORES.AMAZON_ES, query)}
        target="_blank"
        rel={REL}
        aria-label={`${query} Amazon${isUS ? ' US' : ''}`}
        className={LIGHT_BTN}
      >
        {view} Amazon{isUS ? ' US' : ''} <ArrowUpRight />
      </a>
      {isUS && (
        <a
          href={getAffiliateUrl(STORES.NEWEGG, query)}
          target="_blank"
          rel={REL}
          aria-label={`${query} Newegg`}
          className={LIGHT_BTN}
        >
          Newegg <ArrowUpRight />
        </a>
      )}
    </>
  );
}

type StockKind = 'in' | 'low' | 'out' | 'unknown';

function stockKind({ stockStatus, stock }: OfferInfo): StockKind {
  if (stockStatus === 'out_of_stock' || stock === 0) return 'out';
  if (stockStatus === 'low_stock' || (typeof stock === 'number' && stock < 5)) return 'low';
  if (stockStatus === 'in_stock' || stockStatus === 'available' || (typeof stock === 'number' && stock >= 5)) return 'in';
  return 'unknown';
}

/** Badge de estado de stock. Por defecto (sin dato) = "Verificar disponibilidad". */
function StockBadge({ offer, isEn }: { offer: OfferInfo; isEn: boolean }) {
  const kind = stockKind(offer);
  const cfg = {
    in: ['bg-emerald-100 text-emerald-800 border-emerald-200', isEn ? '● In Stock' : '● En Stock'],
    low: ['bg-amber-100 text-amber-800 border-amber-200', isEn ? '🔥 Low Stock' : '🔥 Pocas Unidades'],
    out: ['bg-red-100 text-red-800 border-red-200', isEn ? 'Out of stock' : 'Agotado'],
    unknown: ['bg-zinc-100 text-zinc-600 border-zinc-200', isEn ? 'Check availability' : 'Verificar disponibilidad'],
  }[kind];
  return (
    <span className={`inline-flex items-center w-fit text-[10px] font-semibold leading-none px-2 py-1 rounded-full border ${cfg[0]}`}>
      {cfg[1]}
    </span>
  );
}

/** Precio exacto, "Desde X" para rangos/variantes o aviso de consultar la oferta actual. */
function PriceLabel({ offer, isUS, isEn }: { offer: OfferInfo; isUS: boolean; isEn: boolean }) {
  if (offer.price) {
    return <span className="font-mono text-zinc-950 font-extrabold text-sm md:text-base">{offer.price}</span>;
  }
  if (offer.priceFrom) {
    return (
      <span className="font-mono text-zinc-950 font-extrabold text-sm md:text-base">
        <span className="text-[11px] font-semibold text-zinc-600">{isEn ? 'From' : 'Desde'} </span>
        {offer.priceFrom}
      </span>
    );
  }
  return (
    <span className="max-w-[9.5rem] text-right text-[11px] leading-tight font-semibold text-zinc-600">
      {isEn
        ? `Check current offer on ${isUS ? 'Amazon / Newegg' : 'Amazon'}`
        : 'Consultar oferta actual en Amazon'}
    </span>
  );
}

/** Estado de stock en texto (filas del bloque blanco). Sin dato = "Verificar disponibilidad"; nunca se afirma stock sin fuente. */
export function StockText({ offer = {}, isEn = false }: { offer?: OfferInfo; isEn?: boolean }) {
  const kind = stockKind(offer);
  const cfg = {
    in: ['text-emerald-700', isEn ? '● In stock' : '● En stock'],
    low: ['text-amber-700', isEn ? '🔥 Low stock' : '🔥 Pocas unidades'],
    out: ['text-red-700', isEn ? 'Out of stock' : 'Agotado'],
    unknown: ['text-zinc-600', isEn ? 'Check availability' : 'Verificar disponibilidad'],
  }[kind];
  return <span className={`text-[11px] font-semibold leading-none ${cfg[0]}`}>{cfg[1]}</span>;
}

const LIGHT_BTN_LG =
  'bg-[#FF9900] hover:bg-[#FF8A00] text-zinc-950 font-extrabold text-xs px-4 py-2.5 min-h-[40px] rounded-lg flex items-center gap-1 shrink-0 shadow-sm transition-all hover:scale-[1.02] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 motion-reduce:transition-none motion-reduce:hover:scale-100';

/** Botones de la fila de compra del desglose: "AMAZON ES ↗" / "AMAZON US ↗" + "NEWEGG ↗" (US). */
function LightRowButtons({ query, isUS }: { query: string; isUS: boolean }) {
  return (
    <>
      <a
        href={getAffiliateUrl(isUS ? STORES.AMAZON_US : STORES.AMAZON_ES, query)}
        target="_blank"
        rel={REL}
        aria-label={`${query} Amazon ${isUS ? 'US' : 'ES'}`}
        className={LIGHT_BTN_LG}
      >
        {isUS ? 'AMAZON US' : 'AMAZON ES'} <ArrowUpRight />
      </a>
      {isUS && (
        <a href={getAffiliateUrl(STORES.NEWEGG, query)} target="_blank" rel={REL} aria-label={`${query} Newegg`} className={LIGHT_BTN_LG}>
          NEWEGG <ArrowUpRight />
        </a>
      )}
    </>
  );
}

/** Variante alternativa: sub-fila justo bajo el componente principal. */
function VariantRow({ v, isUS, isEn }: { v: AffiliateVariant; isUS: boolean; isEn: boolean }) {
  return (
    <div className="mt-2 ml-1 pl-3 border-l-2 border-zinc-200 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div className="flex flex-col gap-1 min-w-0 flex-1 basis-[10rem]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 bg-zinc-100 text-zinc-800 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border border-zinc-200 uppercase">
            {v.badge}
          </span>
          <span className="text-xs text-zinc-700 font-medium truncate max-w-[180px] md:max-w-[220px]" title={v.name}>
            {isEn ? 'Variant' : 'Variante'} · {v.name}
          </span>
        </div>
        <StockBadge offer={v} isEn={isEn} />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <PriceLabel offer={v} isUS={isUS} isEn={isEn} />
        <LightStoreButtons query={v.query ?? v.name} isUS={isUS} isEn={isEn} />
      </div>
    </div>
  );
}

/** Fila limpia: badge técnico + nombre + stock + precio + botones; variantes justo debajo. */
function ItemRow({ item, isUS, isEn }: { item: AffiliateItem; isUS: boolean; isEn: boolean }) {
  const cleanName = sanitizeQuery(item.name);
  return (
    <div className="border-b border-zinc-100 py-3 first:pt-0 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1 basis-[10rem]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 bg-zinc-100 text-zinc-800 text-[11px] font-bold font-mono px-2 py-0.5 rounded border border-zinc-200 uppercase">
              {item.type}
            </span>
            <span className="text-xs md:text-sm text-zinc-800 font-semibold truncate max-w-[180px] md:max-w-[220px]" title={cleanName}>
              {cleanName}
            </span>
          </div>
          <StockBadge offer={item} isEn={isEn} />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <PriceLabel offer={item} isUS={isUS} isEn={isEn} />
          <LightStoreButtons query={item.name} isUS={isUS} isEn={isEn} />
        </div>
      </div>
      {item.variants?.slice(0, 3).map((v) => (
        <VariantRow key={`${v.badge}-${v.name}`} v={v} isUS={isUS} isEn={isEn} />
      ))}
    </div>
  );
}

/** Aviso legal de precios dinámicos (Amazon Associates). */
function PriceDisclaimer({ isEn }: { isEn: boolean }) {
  return (
    <p className="text-[10px] text-zinc-500 font-mono pt-2 border-t border-zinc-100 leading-tight">
      {isEn
        ? 'Prices and product availability may change. The final price and applicable stock are those shown on Amazon / the originating store at the time of purchase.'
        : 'Los precios y la disponibilidad de los productos pueden variar. El precio final y el stock aplicable serán los mostrados en Amazon/tienda de origen en el momento de la compra.'}
    </p>
  );
}

/** Pie de transparencia: sin precios reales no se afirma que estén actualizados. */
function AffiliateFooter({ isEn, priceUpdatedAt, hasPrices }: { isEn: boolean; priceUpdatedAt?: string; hasPrices: boolean }) {
  return (
    <p className="text-[10px] text-zinc-600 font-mono text-center pt-1 leading-snug">
      {hasPrices && priceUpdatedAt
        ? isEn
          ? `Prices checked: ${priceUpdatedAt}. `
          : `Precios consultados: ${priceUpdatedAt}. `
        : isEn
          ? 'Direct store links. '
          : 'Enlaces directos a tienda. '}
      {isEn
        ? 'We earn a commission under the affiliate program terms.'
        : 'Ganamos comisión según las condiciones del programa de afiliados.'}
    </p>
  );
}

export const SmartAffiliateCTA: React.FC<SmartAffiliateCTAProps> = ({
  query = '',
  items,
  isEn = false,
  variant = 'full',
  title,
  priceUpdatedAt,
  alertEndpoint,
  onSubscribe,
  className = '',
}) => {
  const region = useRegion();
  const isUS = region === 'US';
  const compact = variant === 'compact';

  if (variant === 'light') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <LightRowButtons query={query} isUS={isUS} />
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <StoreLinks query={query} isUS={isUS} isEn={isEn} variant="compact" />
      </div>
    );
  }

  const buttons = (
    <>
      <StoreLinks query={query} isUS={isUS} isEn={isEn} variant="full" />
      {isUS && <TrustNote isEn={isEn} />}
    </>
  );

  if (variant === 'box') {
    const heading = title ?? (isEn ? 'BEST PRICE & AVAILABILITY' : 'MEJOR PRECIO Y DISPONIBILIDAD');
    const hasItems = Boolean(items && items.length);
    const hasPrices = Boolean(items?.some((i) => i.price || i.priceFrom || i.variants?.some((v) => v.price || v.priceFrom)));
    const alertProduct = hasItems ? items!.map((i) => sanitizeQuery(i.name)).join(' + ') : sanitizeQuery(query);
    return (
      <div className={`relative overflow-hidden bg-white text-zinc-900 rounded-2xl p-4 md:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-zinc-200 flex flex-col gap-3 ${className}`}>
        <h3 className="text-zinc-900 font-extrabold text-sm uppercase tracking-wider">{heading}</h3>
        {hasItems ? (
          <div className="flex-1 flex flex-col justify-center">
            {items!.map((item) => (
              <ItemRow key={`${item.type}-${item.name}`} item={item} isUS={isUS} isEn={isEn} />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <LightStoreButtons query={query} isUS={isUS} isEn={isEn} />
          </div>
        )}
        <PriceAlert
          product={alertProduct}
          region={region}
          isEn={isEn}
          theme="light"
          endpoint={alertEndpoint ?? DEFAULT_ALERT_ENDPOINT}
          onSubscribe={onSubscribe}
        />
        <AffiliateFooter isEn={isEn} priceUpdatedAt={priceUpdatedAt} hasPrices={hasPrices} />
        <PriceDisclaimer isEn={isEn} />
      </div>
    );
  }

  return <div className={`flex flex-col gap-3 ${className}`}>{buttons}</div>;
};

export default SmartAffiliateCTA;
