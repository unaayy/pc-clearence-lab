// src/components/CompatibilityAssistant.jsx
// Asistente de solución de errores: tarjeta HUD con enlaces de búsqueda para resolver una
// incompatibilidad, y banner de "matriz aprobada" cuando todo es compatible.
import React, { memo } from 'react';
import { getAffiliateUrl, STORES } from '../config/stores.js';
import { useRegion } from './SmartAffiliateCTA';

const REL = 'nofollow sponsored noopener noreferrer';

const SEVERITY = {
  error: { color: '#f43f5e', border: 'border-[#f43f5e]/30', bg: 'bg-[#f43f5e]/[0.06]' },
  warn: { color: '#fbbf24', border: 'border-[#fbbf24]/30', bg: 'bg-[#fbbf24]/[0.06]' },
};

const GREEN = '#00FF66';

const linkBase =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl border border-[#00FF66]/40 bg-zinc-900/80 text-[#00FF66] font-orbitron font-bold text-[10px] leading-snug tracking-wide uppercase text-center transition-all duration-200 hover:bg-[#00FF66]/10 hover:border-[#00FF66] hover:shadow-[0_0_15px_rgba(0,255,102,0.2)] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF66]/50';

export const SolutionCard = memo(function SolutionCard({ rec, isEn }) {
  const region = useRegion();
  const isUS = region === 'US';
  const sev = SEVERITY[rec.severity] || SEVERITY.error;

  return (
    <div
      className={`mx-3 mb-3 rounded-xl border ${sev.border} ${sev.bg} p-3.5 flex flex-col gap-3`}
      role="note"
    >
      <div>
        <p className="font-orbitron text-[9px] font-bold tracking-[0.18em] uppercase flex items-center gap-1.5" style={{ color: sev.color }}>
          <span aria-hidden="true">▲</span> {rec.title}
        </p>
        <p className="text-slate-300 text-[11px] leading-relaxed mt-1.5">{rec.message}</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-orbitron text-[8.5px] tracking-[0.2em] uppercase flex items-center gap-1.5" style={{ color: GREEN }}>
          <span aria-hidden="true" className="w-1 h-1 rounded-full" style={{ backgroundColor: GREEN }} />
          {isEn ? 'SUGGESTED FIX' : 'SOLUCIÓN SUGERIDA'}
        </p>

        {rec.actions.map((action) => {
          const amazonStore = isUS ? STORES.AMAZON_US : STORES.AMAZON_ES;
          const storeName = isUS ? 'Amazon US' : 'Amazon ES';
          return (
            <div key={action.query} className="flex items-stretch gap-2">
              <a
                href={getAffiliateUrl(amazonStore, action.query)}
                target="_blank"
                rel={REL}
                className={`${linkBase} flex-1 min-w-0`}
              >
                <span>{action.label} {storeName} ↗</span>
              </a>
              {isUS && (
                <a
                  href={getAffiliateUrl(STORES.NEWEGG, action.query)}
                  target="_blank"
                  rel={REL}
                  aria-label={`${action.label} Newegg`}
                  className={`${linkBase} shrink-0 px-3`}
                >
                  <span>Newegg ↗</span>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

/** Mensaje verde destacado cuando TODA la matriz es compatible. */
export const ApprovedBanner = memo(function ApprovedBanner({ isEn }) {
  return (
    <div
      role="status"
      className="relative overflow-hidden rounded-2xl border border-[#00FF66]/40 bg-[#00FF66]/[0.07] px-4 py-4 flex items-center gap-3.5 shadow-[0_0_20px_rgba(0,255,102,0.12)]"
    >
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-[#00FF66]/15">
        <svg className="w-4 h-4 text-[#00FF66]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="font-orbitron font-bold text-[11px] sm:text-xs tracking-[0.12em] uppercase text-[#00FF66] leading-snug">
          {isEn ? 'COMPATIBILITY MATRIX APPROVED' : 'MATRIZ DE COMPATIBILIDAD APROBADA'}
        </p>
        <p className="font-orbitron text-[10px] tracking-[0.14em] uppercase text-[#00FF66]/70 mt-0.5">
          {isEn ? '• Ready for assembly' : '• Listo para montaje'}
        </p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FF66] to-transparent" />
    </div>
  );
});
