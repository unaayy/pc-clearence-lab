// src/components/SearchInterface.jsx
import React, { useId, useMemo, useRef, useState } from 'react';

const MAX_RESULTS = 40;
const MAX_SUGGESTIONS = 8;

const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const IconSearch = () => (
  <svg className="w-5 h-5 text-white/30 group-focus-within:text-[#00ffff] transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20L16 16" strokeLinecap="round" />
  </svg>
);

const IconLock = () => (
  <svg className="w-5 h-5 text-[#00ffff] drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconClear = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

function HudCombobox({ label, placeholder, items = [], selected, onSelect, onChosen, inputRef, step, lang = 'es' }) {
  const uid = useId();
  const inputId = `${uid}-input`;
  const isEn = lang === 'en';

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    if (!tokens.length) return items.slice(0, MAX_SUGGESTIONS);
    return items
      .filter((it) => {
        const hay = normalize(`${it.brand || ''} ${it.model || ''}`);
        return tokens.every((t) => hay.includes(t));
      })
      .slice(0, MAX_RESULTS);
  }, [items, query]);

  const current = Math.min(active, Math.max(results.length - 1, 0));

  const choose = (item) => {
    const brandText = item.brand && !item.brand.toLowerCase().includes('genér') ? `${item.brand} ` : '';
    setQuery(`${brandText}${item.model}`);
    setOpen(false);
    onSelect(item);
    onChosen?.();
  };

  const clear = () => {
    setQuery('');
    setActive(0);
    onSelect(null);
    setOpen(true);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive(Math.min(current + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(current - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && results[current]) {
        choose(results[current]);
      }
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

  const isLocked = Boolean(selected);

  return (
    <div className={`relative flex flex-col gap-2 w-full perspective-1000 transition-all ${open ? 'z-50' : 'z-10'}`}>
      <div className="flex items-center justify-between px-1 mb-1">
        <label htmlFor={inputId} className="text-[10px] text-[#86868b] tracking-[0.2em] flex items-center gap-2 cursor-pointer font-orbitron uppercase">
          <span className="text-[#00ffff] opacity-80">{step} //</span>
          {label}
        </label>
      </div>

      <div className={`relative group transition-all duration-500 ${isLocked ? 'is-locked scale-[0.98]' : ''}`}>
        <div className={`relative flex items-center w-full h-14 pl-4 pr-3 overflow-hidden backdrop-blur-md transition-all duration-300 z-10 border ${
          isLocked
            ? 'bg-gradient-to-r from-[#00ffff]/10 to-transparent border-[#00ffff]/40 shadow-[inset_0_0_20px_rgba(0,255,255,0.1)] rounded-lg'
            : open
            ? 'bg-black/90 border-[#00ffff]/50 shadow-[0_0_20px_rgba(0,255,255,0.15)] rounded-t-xl rounded-b-none'
            : 'bg-white/[0.03] border-white/10 hover:border-white/30 rounded-xl'
        }`}>
          {isLocked ? <IconLock /> : <IconSearch />}
          
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            autoComplete="off"
            className={`flex-1 bg-transparent border-none outline-none text-xs sm:text-sm px-3 w-full font-orbitron uppercase tracking-wider relative z-10 transition-colors ${
              isLocked ? 'text-[#00ffff] font-bold' : 'text-white placeholder-[#666670]'
            }`}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
              if (selected) onSelect(null);
            }}
            onFocus={(e) => {
              setOpen(true);
              if (selected) e.target.select();
            }}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            onKeyDown={onKeyDown}
          />

          {query && (
            <button type="button" className="relative z-10 p-2 text-[#86868b] hover:text-[#00ffff] hover:bg-[#00ffff]/10 rounded-md transition-all" onClick={clear}>
              <IconClear />
            </button>
          )}
        </div>

        {open && (
          <div className="absolute top-full left-0 right-0 z-[100] bg-[#08080a] border border-white/15 border-t-[#00ffff]/30 rounded-b-xl shadow-[0_30px_70px_rgba(0,0,0,0.95)] max-h-[280px] overflow-y-auto transform origin-top animate-dropdown-open flex flex-col p-2 gap-1 custom-scrollbar">
            {results.length === 0 && (
              <div className="p-4 text-sm text-[#86868b] font-light">
                {isEn ? `No data for "${query}"...` : `Sin datos para «${query}»...`}
              </div>
            )}
            {results.map((it, i) => {
              const isSelected = i === current;
              return (
                <div
                  key={it.slug || i}
                  className={`relative flex items-center justify-between px-4 py-3 rounded-lg text-sm cursor-pointer transition-all duration-200 overflow-hidden group/item animate-item-enter ${
                    isSelected ? 'bg-[#00ffff]/10 border border-[#00ffff]/30' : 'bg-transparent border border-transparent hover:bg-white/5'
                  }`}
                  style={{ animationDelay: `${i * 35}ms` }}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(it);
                  }}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00ffff] shadow-[0_0_10px_#00ffff]"></div>}
                  <span className="truncate pr-4 flex-1">
                    {it.brand && !it.brand.toLowerCase().includes('genér') && !it.brand.toLowerCase().includes('gener') && (
                      <span className={`font-orbitron font-bold tracking-wide mr-1 ${isSelected ? 'text-[#00ffff]' : 'text-slate-300 group-hover/item:text-white'}`}>
                        {it.brand}
                      </span>
                    )}
                    <span className={`font-sans font-light ${isSelected ? 'text-white' : 'text-slate-400 group-hover/item:text-slate-200'}`}>
                      {it.model}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchInterface({ cases = [], gpus = [] }) {
  const lang = typeof window !== 'undefined' && window.location.pathname.startsWith('/en') ? 'en' : 'es';
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedGpu, setSelectedGpu] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const caseInput = useRef(null);
  const gpuInput = useRef(null);

  const isEn = lang === 'en';
  const langPrefix = isEn ? '/en' : '';
  const ready = Boolean(selectedCase && selectedGpu);

  const caseSlug = selectedCase?.slug;
  const gpuSlug = selectedGpu?.slug;

  const targetUrl = (caseSlug && gpuSlug) ? `${langPrefix}/${caseSlug}-vs-${gpuSlug}` : '#';

  const handleNavigate = (e) => {
    e.preventDefault();
    if (!ready || !caseSlug || !gpuSlug || isVerifying) return;
    setIsVerifying(true);
    window.location.href = targetUrl;
  };

  const afterCase = () => setTimeout(() => (selectedGpu ? null : gpuInput).current?.focus(), 0);
  const afterGpu = () => setTimeout(() => (selectedCase ? null : caseInput).current?.focus(), 0);

  return (
    <div className="relative w-full max-w-[920px] mx-auto z-20 mt-8 sm:mt-12">
      <div className="relative rounded-[2rem] bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-black/80 border border-white/10 backdrop-blur-3xl p-6 sm:p-10 shadow-[0_40px_80px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-visible">
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full z-20">
            <div className="flex-1 w-full">
              <HudCombobox
                label={isEn ? "CHASSIS / CASE" : "CHASIS DETALLE"}
                step="01"
                placeholder="NZXT, CORSAIR, LIAN LI..."
                items={cases}
                selected={selectedCase}
                onSelect={setSelectedCase}
                onChosen={afterCase}
                inputRef={caseInput}
                lang={lang}
              />
            </div>

            <div className="hidden md:flex items-center justify-center w-10 h-10 bg-[#08080a] border border-white/10 rounded-sm rotate-45 shadow-[0_0_15px_rgba(0,255,255,0.05)] shrink-0 mt-4 transition-all duration-500">
              <span className={`rotate-[-45deg] font-orbitron text-[10px] tracking-widest font-bold transition-colors duration-500 ${ready ? 'text-[#00ffff] drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]' : 'text-white/30'}`}>
                VS
              </span>
            </div>

            <div className="flex-1 w-full">
              <HudCombobox
                label="TARGET GPU"
                step="02"
                placeholder="RTX 4090, RX 7900..."
                items={gpus}
                selected={selectedGpu}
                onSelect={setSelectedGpu}
                onChosen={afterGpu}
                inputRef={gpuInput}
                lang={lang}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 w-full mt-8 pt-8 border-t border-white/5 min-h-[80px]">
            <div className="flex-1 w-full flex items-center justify-center md:justify-start">
              {ready ? (
                <div className="flex items-center gap-4 animate-telemetry-in">
                  <div className="w-10 h-10 rounded-full border border-[#00ffff] bg-[#00ffff]/10 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                    <svg className="w-5 h-5 text-[#00ffff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xs text-[#00ffff] font-orbitron tracking-widest uppercase leading-relaxed">
                    {isEn ? <>Physical nodes linked.<br/>Ready for dimensions scan.</> : <>Nodos físicos vinculados.<br/>Listo para escáner de dimensiones.</>}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4 opacity-50">
                  <div className="w-10 h-10 rounded-full border border-dashed border-[#00ffff]/40 animate-[spin_10s_linear_infinite]"></div>
                  <p className="text-xs text-[#86868b] font-orbitron tracking-widest uppercase leading-relaxed">
                    {isEn ? <>Awaiting linking<br/>the 2 hardware nodes...</> : <>A la espera de enlazar<br/>los 2 nodos de hardware...</>}
                  </p>
                </div>
              )}
            </div>

            <a
              href={targetUrl}
              onClick={handleNavigate}
              className={`flex-none w-full md:w-auto h-14 px-10 rounded-xl font-orbitron font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group ${
                ready
                  ? 'bg-[#00ffff] text-black shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_35px_rgba(0,255,255,0.5)] active:scale-95 cursor-pointer'
                  : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed pointer-events-none'
              }`}
            >
              <span className="relative z-10">
                {isVerifying ? (isEn ? 'PROCESSING...' : 'PROCESANDO...') : (isEn ? 'START ANALYSIS' : 'INICIAR ANÁLISIS')}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}