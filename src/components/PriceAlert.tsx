// src/components/PriceAlert.tsx
// Botón + formulario de "alerta si baja de precio". Requiere backend: sin `endpoint` ni `onSubscribe`
// no renderiza nada (no se capturan emails que luego no se guardan).
// El endpoint por defecto puede configurarse con PUBLIC_PRICE_ALERT_ENDPOINT.
import React, { useId, useState } from 'react';

export interface AlertPayload {
  email: string;
  product: string;
  region: 'ES' | 'US';
  locale: 'es' | 'en';
  consent: true;
}

interface PriceAlertProps {
  product: string;
  region: 'ES' | 'US';
  isEn?: boolean;
  theme?: 'dark' | 'light';
  endpoint?: string;
  onSubscribe?: (payload: AlertPayload) => Promise<void>;
  privacyHref?: string;
}

export const DEFAULT_ALERT_ENDPOINT: string | undefined =
  (import.meta as any).env?.PUBLIC_PRICE_ALERT_ENDPOINT || undefined;

const THEMES = {
  dark: {
    button:
      'w-full min-h-[44px] px-4 py-3 rounded-xl border border-cyan-500/40 bg-zinc-900/90 text-cyan-400 font-mono text-xs font-bold tracking-wide uppercase transition-all duration-200 hover:border-cyan-400 hover:bg-zinc-900 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60',
    form: 'mt-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-3',
    label: 'block font-mono text-[11px] uppercase tracking-wide text-zinc-400',
    input:
      'w-full rounded-lg border border-zinc-700 bg-zinc-950/90 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/60',
    consent: 'flex items-start gap-2 text-[11px] leading-snug text-zinc-400',
    link: 'text-cyan-400 underline underline-offset-2',
    check: 'mt-0.5 h-4 w-4 shrink-0 accent-cyan-400',
    submit:
      'w-full min-h-[40px] rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-cyan-400 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50',
    ok: 'font-mono text-xs text-cyan-400',
    err: 'font-mono text-[11px] text-rose-400',
  },
  light: {
    button:
      'w-full min-h-[44px] bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold text-xs py-2.5 px-4 rounded-xl border border-zinc-200 flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400',
    form: 'mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-3',
    label: 'block text-[11px] font-semibold text-zinc-700',
    input:
      'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400',
    consent: 'flex items-start gap-2 text-[11px] leading-snug text-zinc-600',
    link: 'text-zinc-900 underline underline-offset-2',
    check: 'mt-0.5 h-4 w-4 shrink-0 accent-zinc-800',
    submit:
      'w-full min-h-[40px] rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50',
    ok: 'text-xs font-semibold text-emerald-700',
    err: 'text-[11px] font-semibold text-red-600',
  },
} as const;

export const PriceAlert: React.FC<PriceAlertProps> = ({
  product,
  region,
  isEn = false,
  theme = 'dark',
  endpoint = DEFAULT_ALERT_ENDPOINT,
  onSubscribe,
  privacyHref = '/privacidad',
}) => {
  const uid = useId();
  const c = THEMES[theme];
  const t = (en: string, es: string) => (isEn ? en : es);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');

  if (!endpoint && !onSubscribe) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent || status === 'sending') return;
    const payload: AlertPayload = { email: email.trim(), product, region, locale: isEn ? 'en' : 'es', consent: true };
    setStatus('sending');
    try {
      if (onSubscribe) {
        await onSubscribe(payload);
      } else {
        const res = await fetch(endpoint as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(String(res.status));
      }
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  };

  const label =
    theme === 'light'
      ? `🔔 ${t('Notify me if the price drops', 'Avísame si baja de precio')}`
      : `🔔 ${t('CREATE ALERT IF THE PRICE DROPS', 'CREAR ALERTA SI BAJA DE PRECIO')}`;

  return (
    <div className="pt-1">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={`${uid}-alert`} className={c.button}>
        {label}
      </button>
      {open && (
        <form id={`${uid}-alert`} onSubmit={submit} className={c.form}>
          {status === 'ok' ? (
            <p role="status" className={c.ok}>
              ✓ {t('Done! We will email you if the price drops.', '¡Listo! Te avisaremos por email si baja el precio.')}
            </p>
          ) : (
            <>
              <label htmlFor={`${uid}-email`} className={c.label}>
                {t('Your email', 'Tu email')}
              </label>
              <input
                id={`${uid}-email`}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={c.input}
              />
              <label className={c.consent}>
                <input type="checkbox" checked={consent} required onChange={(e) => setConsent(e.target.checked)} className={c.check} />
                <span>
                  {t('I agree to receive price alerts for this product and accept the ', 'Acepto recibir alertas de precio de este producto y la ')}
                  <a href={privacyHref} className={c.link}>
                    {t('privacy policy', 'política de privacidad')}
                  </a>
                  .
                </span>
              </label>
              <button type="submit" disabled={!consent || status === 'sending'} className={c.submit}>
                {status === 'sending' ? t('SENDING…', 'ENVIANDO…') : t('ACTIVATE ALERT', 'ACTIVAR ALERTA')}
              </button>
              {status === 'error' && (
                <p role="alert" className={c.err}>
                  {t('We could not save your alert. Please try again later.', 'No pudimos guardar tu alerta. Inténtalo de nuevo más tarde.')}
                </p>
              )}
            </>
          )}
        </form>
      )}
    </div>
  );
};

export default PriceAlert;
