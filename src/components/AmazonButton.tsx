// src/components/AmazonButton.tsx
// Primitivos visuales de los botones de compra. La lógica de región/URLs vive en SmartAffiliateCTA.tsx.
import React from 'react';

export type Market = 'ES' | 'US';

interface StoreButtonProps {
  href: string;
  isEn?: boolean;
  /**
   * 'full'    = botón CRO grande (por defecto).
   * 'compact' = versión en línea para filas de listas.
   * 'chip'    = botón HUD ámbar para las tiras de inventario del bloque "Precio y disponibilidad".
   */
  variant?: 'full' | 'compact' | 'chip';
  ariaLabel?: string;
}

interface AmazonButtonProps extends StoreButtonProps {
  /** Mercado de Amazon (cambia el texto). Por defecto 'ES'. */
  market?: Market;
  /** Muestra el microcopy de confianza bajo el botón 'full'. Por defecto true. */
  showTrust?: boolean;
}

const REL = 'nofollow sponsored noopener noreferrer';

// Estilo HUD (neón naranja Amazon sobre fondo oscuro) compartido por los megabotones de Amazon
const HUD_FULL =
  'group w-full min-h-[64px] py-4 px-5 flex items-center gap-4 rounded-2xl border border-[#FF9900]/40 bg-zinc-950/90 text-amber-400 font-bold transition-all duration-200 ease-out hover:border-amber-400 hover:bg-amber-500/10 hover:shadow-[0_0_15px_rgba(255,153,0,0.25)] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]';

// CTA de compra "premium HUD": fondo casi negro, borde dorado fino, glow muy suave.
// El amarillo (#FFC21A) se reserva exclusivamente para la acción de compra.
const CTA_FULL =
  'group w-full min-h-[64px] px-3.5 sm:px-5 py-3 flex items-center gap-2.5 sm:gap-4 rounded-2xl cursor-pointer ' +
  'border border-[#FFC21A]/70 bg-[#0B0B0D] text-[#FFC21A] ' +
  'shadow-[0_0_18px_rgba(255,194,26,0.10)] ' +
  'transition-[border-color,box-shadow,background-color] duration-200 ease-out ' +
  'hover:border-[#FFC21A] hover:bg-[#121214] hover:shadow-[0_0_22px_rgba(255,194,26,0.18)] ' +
  'motion-reduce:transition-none ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0D]';

// Botón "chip" HUD ámbar (Amazon ES / US y Newegg) para las tiras de componente.
const CHIP =
  'inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] text-xs font-mono font-bold tracking-wide uppercase rounded-lg cursor-pointer ' +
  'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:border-amber-400 ' +
  'transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-[1.02] ' +
  'motion-reduce:transition-none motion-reduce:hover:scale-100 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60';

/** Flecha de salida externa (↗) como SVG: grosor y tamaño consistentes en todos los sistemas. */
const ArrowUpRight = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M7 17L17 7" />
    <path d="M8.5 7H17v8.5" />
  </svg>
);

const CartIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3a1 1 0 00.7 1.7H17M17 17a2 2 0 100 4 2 2 0 000-4zM9 17a2 2 0 100 4 2 2 0 000-4z" />
  </svg>
);

/**
 * Marca monocroma de Amazon (letra "a" + flecha/sonrisa), dibujada con trazos.
 * Hereda el color del botón vía currentColor, así sigue el tono neón (text-amber-400).
 */
export const AmazonLogo = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {/* "a" */}
    <circle cx="10.5" cy="8" r="3" />
    <path d="M13.5 5v6.5" />
    {/* sonrisa con punta de flecha */}
    <path d="M4 15.2C8 19 15 19 20 15" />
    <path d="M16.4 14.9L20 15l-.7 3.5" />
  </svg>
);

export const ChipIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
    <path strokeLinecap="round" d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" />
  </svg>
);

export const AmazonButton: React.FC<AmazonButtonProps> = ({ href, isEn = false, variant = 'full', ariaLabel, market = 'ES', showTrust = true }) => {
  const disabled = !href || href === '#';
  // En EE.UU. la píldora compacta se llama solo "AMAZON" (junto a NEWEGG)
  const name = variant !== 'full' && market === 'US' ? 'AMAZON' : `AMAZON ${market}`;

  if (variant === 'chip') {
    return (
      <a href={href} target="_blank" rel={REL} aria-label={ariaLabel} aria-disabled={disabled} className={CHIP}>
        <AmazonLogo className="h-4 w-4 shrink-0" />
        <span>{name}</span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-80" />
      </a>
    );
  }

  if (variant === 'compact') {
    return (
      <a
        href={href}
        target="_blank"
        rel={REL}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl border border-amber-500/30 bg-zinc-900/80 text-amber-400 font-bold font-orbitron text-[11px] tracking-wide uppercase transition-all duration-200 hover:bg-amber-500/20 hover:border-amber-400 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
      >
        <span className="inline-flex items-center">
          <AmazonLogo className="mr-2 h-4 w-4 shrink-0" />
          {name}
        </span>
        <span aria-hidden="true">{'\u2197\uFE0E'}</span>
      </a>
    );
  }

  const store = market === 'US' ? 'AMAZON US' : 'AMAZON';

  return (
    <div className="w-full flex flex-col items-center gap-2.5">
      <a
        href={href}
        target="_blank"
        rel={REL}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        className={CTA_FULL}
      >
        <AmazonLogo className="h-7 w-7 shrink-0" />
        <span className="flex-1 min-w-0 flex flex-col items-center justify-center text-center">
          <span className="font-orbitron text-[12px] min-[400px]:text-[15px] font-bold uppercase tracking-[0.03em] min-[400px]:tracking-[0.08em] leading-tight">
            {isEn ? 'CHECK PRICE & STOCK' : 'VER PRECIO Y STOCK'}
          </span>
          <span className="mt-1 font-orbitron text-[10px] min-[400px]:text-[11px] font-medium uppercase tracking-[0.22em] leading-none text-[#FFC21A]/70">
            {isEn ? `ON ${store}` : `EN ${store}`}
          </span>
        </span>
        <ArrowUpRight
          className={
            'h-6 w-6 shrink-0 transition-transform duration-200 ease-out ' +
            'group-hover:translate-x-[3px] group-hover:-translate-y-[3px] ' +
            'motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0'
          }
        />
      </a>
      {showTrust && <TrustNote isEn={isEn} />}
    </div>
  );
};

/** Microcopy de confianza bajo el CTA: claramente secundario. */
export const TrustNote: React.FC<{ isEn?: boolean }> = ({ isEn = false }) => (
  <p className="text-center text-[11px] leading-snug tracking-wide text-slate-500">
    {isEn ? '✓ Updated price · Shipping & returns' : '✓ Precio actualizado · Envío y devoluciones'}
  </p>
);

interface ScrollToBuyButtonProps {
  /** ID de la sección destino (sin '#'). */
  targetId?: string;
  isEn?: boolean;
  /** Nº de componentes del análisis (se muestra en el título). */
  count?: number;
}

/** Megabotón superior: en vez de abrir un enlace externo, hace scroll suave a la lista de compra. */
export const ScrollToBuyButton: React.FC<ScrollToBuyButtonProps> = ({ targetId = 'disponibilidad-compra', isEn = false, count }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(targetId);
    if (!target) return; // sin destino: deja actuar al ancla nativa
    e.preventDefault();
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="group block bg-white text-zinc-900 rounded-2xl p-4 border border-zinc-200 shadow-xl space-y-2 cursor-pointer hover:border-amber-400 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 motion-reduce:transition-none"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="font-extrabold text-sm sm:text-base uppercase tracking-wide leading-tight">
          {isEn ? 'VIEW PURCHASE OPTIONS' : 'VER OPCIONES DE COMPRA'}{typeof count === 'number' && count > 0 ? ` (${count} ${isEn ? (count === 1 ? 'COMPONENT' : 'COMPONENTS') : (count === 1 ? 'COMPONENTE' : 'COMPONENTES')})` : ''}
        </span>
        <span aria-hidden="true" className="shrink-0 text-xl font-black leading-none transition-transform duration-200 group-hover:translate-y-0.5 motion-reduce:transform-none">↓</span>
      </span>
      <span className="block text-xs text-zinc-600 font-medium">
        {isEn ? 'Click to scroll to the Amazon shopping list' : 'Haz clic para desplazarte a la lista de compra en Amazon'}
      </span>
    </a>
  );
};

/** Botón Newegg (solo tráfico US): estilo HUD oscuro con borde/texto dorado. */
export const NeweggButton: React.FC<StoreButtonProps> = ({ href, isEn = false, variant = 'full', ariaLabel }) => {
  const disabled = !href || href === '#';

  if (variant === 'chip') {
    return (
      <a href={href} target="_blank" rel={REL} aria-label={ariaLabel} aria-disabled={disabled} className={CHIP}>
        <ChipIcon className="h-4 w-4 shrink-0" />
        <span>NEWEGG</span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-80" />
      </a>
    );
  }

  if (variant === 'compact') {
    return (
      <a
        href={href}
        target="_blank"
        rel={REL}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl border border-[#CC9900] bg-zinc-900/80 text-amber-400 font-bold font-orbitron text-[11px] tracking-wide uppercase transition-all duration-200 hover:shadow-[0_0_20px_rgba(204,153,0,0.35)] hover:bg-zinc-900 hover:scale-[1.02] active:scale-[0.98]"
      >
        <ChipIcon className="w-4 h-4" />
        <span>NEWEGG</span>
        <span aria-hidden="true">{'\u2197\uFE0E'}</span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel={REL}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className="group w-full min-h-[64px] py-4 px-5 flex items-center gap-4 rounded-2xl border border-[#CC9900] bg-zinc-900/80 text-amber-400 font-bold transition-all duration-200 ease-out hover:shadow-[0_0_20px_rgba(204,153,0,0.35)] hover:bg-zinc-900 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CC9900] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]"
    >
      <ChipIcon className="w-6 h-6 shrink-0" />
      <span className="flex-1 min-w-0 text-center">
        <span className="block font-orbitron text-[13px] sm:text-base font-bold uppercase tracking-wide leading-tight">
          {isEn ? 'COMPARE PRICE ON NEWEGG' : 'COMPARAR PRECIO EN NEWEGG'}
        </span>
        <span className="block mt-1 text-[11px] sm:text-xs font-medium text-amber-200/60 leading-tight">
          {isEn ? 'PC-hardware specialist • Frequent deals' : 'Especialista en hardware • Ofertas frecuentes'}
        </span>
      </span>
      <span aria-hidden="true" className="shrink-0 text-xl leading-none transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">{'\u2197\uFE0E'}</span>
    </a>
  );
};

export default AmazonButton;
