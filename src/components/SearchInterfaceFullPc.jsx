import React, { useId, useMemo, useRef, useState } from 'react';

const MAX_RESULTS = 40;
const MAX_SUGGESTIONS = 8;

const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const IconSearch = () => (
  <svg className="w-4 h-4 text-white/30 group-focus-within:text-[#00ffff] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20L16 16" strokeLinecap="round" />
  </svg>
);
const IconLock = () => (
  <svg className="w-4 h-4 text-[#00ffff] drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconClear = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

function CompactCombobox({ label, step, placeholder, items = [], selected, onSelect, inputRef, align = 'left' }) {
  const uid = useId();
  const inputId = `${uid}-input`;

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    if (!items || items.length === 0) return [];
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    if (!tokens.length) return items.slice(0, MAX_SUGGESTIONS);
    return items.filter((it) => {
      const hay = normalize(`${it.brand || ''} ${it.model || ''}`);
      return tokens.every((t) => hay.includes(t));
    }).slice(0, MAX_RESULTS);
  }, [items, query]);

  const current = Math.min(active, Math.max(results.length - 1, 0));

  const choose = (item) => {
    setQuery(`${item.brand} ${item.model}`);
    setOpen(false);
    onSelect(item);
  };

  const clear = () => {
    setQuery('');
    setActive(0);
    onSelect(null);
    setOpen(true);
    inputRef.current?.focus();
  };

  const isLocked = Boolean(selected);
  const hasData = items && items.length > 0;

  return (
    <div className={`relative flex flex-col gap-1.5 w-full transition-all ${open ? 'z-50' : 'z-10'}`}>
      <label htmlFor={inputId} className={`text-[9px] text-[#86868b] tracking-[0.2em] flex items-center gap-1.5 cursor-pointer font-orbitron uppercase ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
        <span className="text-[#00ffff] opacity-80">{step} //</span>
        {label}
      </label>

      <div className={`relative group transition-all duration-300 ${isLocked ? 'scale-[0.98]' : ''}`}>
        <div className={`relative flex items-center w-full h-11 pl-3 pr-2 overflow-hidden backdrop-blur-md transition-all duration-300 z-10 border ${
          isLocked 
            ? 'bg-[#00ffff]/10 border-[#00ffff]/40 shadow-[inset_0_0_15px_rgba(0,255,255,0.1)] rounded-lg' 
            : open 
            ? 'bg-black/90 border-[#00ffff]/50 rounded-t-lg rounded-b-none'
            : 'bg-white/[0.03] border-white/10 hover:border-white/30 rounded-lg'
        } ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00ffff]/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>

          {isLocked ? <IconLock /> : <IconSearch />}
          
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            disabled={!hasData}
            autoComplete="off"
            className={`flex-1 bg-transparent border-none outline-none text-xs px-2 w-full font-orbitron uppercase tracking-wider relative z-10 transition-colors ${
              align === 'right' ? 'text-right' : 'text-left'
            } ${isLocked ? 'text-[#00ffff] font-bold' : 'text-white placeholder-[#666670]'} ${!hasData ? 'cursor-not-allowed opacity-50' : ''}`}
            placeholder={hasData ? placeholder : 'PRÓXIMAMENTE...'}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
              if (selected) onSelect(null);
            }}
            onFocus={(e) => {
              if (hasData) { setOpen(true); if (selected) e.target.select(); }
            }}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
          />

          {query && (
            <button type="button" className="relative z-10 p-1.5 text-[#86868b] hover:text-[#00ffff] hover:bg-[#00ffff]/10 rounded-md transition-all" onClick={clear}>
              <IconClear />
            </button>
          )}
        </div>

        {open && hasData && (
          <div className="absolute top-full left-0 right-0 z-[100] bg-[#08080a] border border-white/15 border-t-[#00ffff]/30 rounded-b-lg shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-[220px] overflow-y-auto transform origin-top flex flex-col p-1.5 gap-1">
            {results.length === 0 ? (
              <div className="p-3 text-xs text-[#86868b] font-light">Sin coincidencias...</div>
            ) : (
              results.map((it, i) => (
                <div
                  key={it.slug}
                  className={`relative flex items-center justify-between px-3 py-2 rounded-md text-xs cursor-pointer transition-all duration-200 overflow-hidden ${
                    i === current ? 'bg-[#00ffff]/10 border border-[#00ffff]/30' : 'bg-transparent border border-transparent hover:bg-white/5'
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(it)}
                >
                  <span className="truncate pr-2 flex-1">
                    <span className={`font-orbitron font-bold tracking-wide mr-1 ${i === current ? 'text-[#00ffff]' : 'text-slate-300'}`}>{it.brand}</span>
                    <span className={`font-sans font-light ${i === current ? 'text-white' : 'text-slate-400'}`}>{it.model}</span>
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchInterfaceFullPc({ cpus = [], coolers = [], gpus = [], psus = [], cases = [], motherboards = [], rams = [], storages = [] }) {
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedMb, setSelectedMb] = useState(null);
  const [selectedCpu, setSelectedCpu] = useState(null);
  const [selectedCooler, setSelectedCooler] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);
  const [selectedGpu, setSelectedGpu] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [selectedPsu, setSelectedPsu] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const ready = Boolean(selectedCase && selectedCpu && selectedGpu && selectedPsu);

  const handleNavigate = (e) => {
    e.preventDefault();
    if (!ready || isVerifying) return;
    setIsVerifying(true);

    const queryParams = new URLSearchParams();
    if (selectedCase) queryParams.set('case', selectedCase.slug);
    if (selectedCpu) queryParams.set('cpu', selectedCpu.slug);
    if (selectedGpu) queryParams.set('gpu', selectedGpu.slug);
    if (selectedPsu) queryParams.set('psu', selectedPsu.slug);
    if (selectedCooler) queryParams.set('cooler', selectedCooler.slug);
    if (selectedMb) queryParams.set('mb', selectedMb.slug);
    if (selectedRam) queryParams.set('ram', selectedRam.slug);
    if (selectedStorage) queryParams.set('storage', selectedStorage.slug);

    window.location.href = `/build?${queryParams.toString()}`;
  };

  return (
    <div className="relative w-full max-w-[1200px] mx-auto z-20 mt-8 sm:mt-12 font-sans">
      <div className="relative rounded-[2rem] bg-[#050507]/60 border border-white/10 backdrop-blur-2xl p-6 shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)]">
        
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-8 items-center relative z-10">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="flex flex-col gap-6 order-2 lg:order-1">
            <CompactCombobox label="PROCESADOR (CPU)" step="01" placeholder="INTEL I9, RYZEN 7..." items={cpus} selected={selectedCpu} onSelect={setSelectedCpu} inputRef={useRef()} />
            <CompactCombobox label="REFRIGERACIÓN" step="02" placeholder="AIO 360, TORRE..." items={coolers} selected={selectedCooler} onSelect={setSelectedCooler} inputRef={useRef()} />
            <CompactCombobox label="PLACA BASE" step="03" placeholder="Z790, B650..." items={motherboards} selected={selectedMb} onSelect={setSelectedMb} inputRef={useRef()} />
            <CompactCombobox label="MEMORIA RAM" step="04" placeholder="DDR5 6000MHZ..." items={rams} selected={selectedRam} onSelect={setSelectedRam} inputRef={useRef()} />
          </div>

          {/* DIAGRAMA CENTRAL SVG ("PLANO" TÉCNICO) */}
          <div className="flex justify-center items-center order-1 lg:order-2 h-full min-h-[400px] relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.1)_0%,transparent_60%)] pointer-events-none"></div>
            
            <svg viewBox="0 0 400 450" className="w-full max-w-[360px] drop-shadow-[0_0_20px_rgba(0,255,255,0.15)] transition-all duration-500">
              
              {/* ESTRUCTURA CHASIS */}
              <rect x="50" y="20" width="300" height="400" rx="10" fill="#090d13" stroke={selectedCase ? '#00ffff' : 'white'} strokeWidth="2" strokeOpacity={selectedCase ? '0.6' : '0.2'} className="transition-all duration-300" />
              
              {/* VENTILADORES FRONTALES (Se iluminan si hay caja seleccionada) */}
              <g transform="translate(320, 85)" className="transition-all duration-300">
                <circle cx="0" cy="0" r="18" fill="none" stroke={selectedCase ? '#00ffff' : 'white'} strokeWidth="1.5" strokeOpacity={selectedCase ? '0.4' : '0.1'} strokeDasharray="3 3"/>
                <circle cx="0" cy="45" r="18" fill="none" stroke={selectedCase ? '#00ffff' : 'white'} strokeWidth="1.5" strokeOpacity={selectedCase ? '0.4' : '0.1'} strokeDasharray="3 3"/>
                <circle cx="0" cy="90" r="18" fill="none" stroke={selectedCase ? '#00ffff' : 'white'} strokeWidth="1.5" strokeOpacity={selectedCase ? '0.4' : '0.1'} strokeDasharray="3 3"/>
              </g>

              {/* VENTILADOR TRASERO */}
              <circle cx="75" cy="85" r="16" fill="none" stroke={selectedCase ? '#00ffff' : 'white'} strokeWidth="1.5" strokeOpacity={selectedCase ? '0.3' : '0.1'} strokeDasharray="3 3" className="transition-all duration-300"/>

              {/* PLACA BASE */}
              <rect x="70" y="50" width="180" height="230" rx="4" fill="#161b22" stroke={selectedMb ? '#00ffff' : 'white'} strokeWidth="1.5" strokeOpacity={selectedMb ? '0.8' : '0.15'} className="transition-all duration-300" />
              
              {/* CPU */}
              <rect x="130" y="90" width="40" height="40" rx="4" fill="#0d1117" stroke={selectedCpu ? '#00ffff' : 'white'} strokeWidth="1.5" strokeOpacity={selectedCpu ? '0.9' : '0.2'} className="transition-all duration-300" />
              <circle cx="150" cy="110" r="10" fill="none" stroke={selectedCooler ? '#00ffff' : 'white'} strokeWidth="1.5" strokeOpacity={selectedCooler ? '0.9' : '0.1'} strokeDasharray="2 2" className="transition-all duration-300" />

              {/* RAM */}
              <g transform="translate(190, 80)" className="transition-all duration-300">
                <rect x="0" y="0" width="6" height="60" rx="1" fill="#0d1117" stroke={selectedRam ? '#00ffff' : 'white'} strokeOpacity={selectedRam ? '0.7' : '0.15'} />
                <rect x="12" y="0" width="6" height="60" rx="1" fill="#0d1117" stroke={selectedRam ? '#00ffff' : 'white'} strokeOpacity={selectedRam ? '0.7' : '0.15'} />
              </g>

              {/* GPU */}
              <rect x="70" y="180" width="220" height="40" rx="4" fill="#0d1117" stroke={selectedGpu ? '#00ffff' : 'white'} strokeWidth="1.5" strokeOpacity={selectedGpu ? '0.9' : '0.15'} className="transition-all duration-300" />
              <g className="transition-all duration-300" stroke={selectedGpu ? '#00ffff' : 'white'} strokeOpacity={selectedGpu ? '0.4' : '0.05'} strokeWidth="1">
                <circle cx="100" cy="200" r="12" fill="none" />
                <circle cx="145" cy="200" r="12" fill="none" />
                <circle cx="190" cy="200" r="12" fill="none" />
              </g>
              <text x="250" y="204" fill={selectedGpu ? '#00ffff' : 'white'} opacity={selectedGpu ? '1' : '0.2'} fontFamily="Orbitron" fontSize="12" fontWeight="bold" textAnchor="middle" className="transition-all duration-300">GPU</text>

              {/* NVMe SSD */}
              <rect x="130" y="240" width="60" height="15" rx="2" fill="#0d1117" stroke={selectedStorage ? '#00ffff' : 'white'} strokeWidth="1.5" strokeOpacity={selectedStorage ? '0.8' : '0.15'} className="transition-all duration-300" />

              {/* PSU Y COMPARTIMENTO INFERIOR */}
              <rect x="50" y="320" width="300" height="100" rx="4" fill="#161b22" stroke={selectedCase ? '#00ffff' : 'white'} strokeWidth="1.5" strokeOpacity={selectedCase ? '0.3' : '0.1'} className="transition-all duration-300" />
              <rect x="70" y="340" width="100" height="60" rx="4" fill="#0d1117" stroke={selectedPsu ? '#00ffff' : 'white'} strokeWidth="1.5" strokeOpacity={selectedPsu ? '0.9' : '0.15'} className="transition-all duration-300" />
              <circle cx="120" cy="370" r="18" fill="none" stroke={selectedPsu ? '#00ffff' : 'white'} strokeOpacity={selectedPsu ? '0.4' : '0.05'} strokeWidth="1" strokeDasharray="2 2" className="transition-all duration-300" />
              
            </svg>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="flex flex-col gap-6 order-3 lg:order-3">
            <CompactCombobox label="CHASIS / CAJA" step="05" placeholder="NZXT H9, CORSAIR..." items={cases} selected={selectedCase} onSelect={setSelectedCase} inputRef={useRef()} align="right" />
            <CompactCombobox label="TARJETA GRÁFICA (GPU)" step="06" placeholder="RTX 4090, RX 7900..." items={gpus} selected={selectedGpu} onSelect={setSelectedGpu} inputRef={useRef()} align="right" />
            <CompactCombobox label="FUENTE (PSU)" step="07" placeholder="1000W ATX 3.0..." items={psus} selected={selectedPsu} onSelect={setSelectedPsu} inputRef={useRef()} align="right" />
            <CompactCombobox label="ALMACENAMIENTO" step="08" placeholder="NVME 2TB GEN4..." items={storages} selected={selectedStorage} onSelect={setSelectedStorage} inputRef={useRef()} align="right" />
          </div>

        </div>

        {/* BOTÓN INFERIOR DE AUDITORÍA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-10 pt-6 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${ready ? 'border-[#00ffff] bg-[#00ffff]/10' : 'border-[#00ffff]/30 border-dashed animate-spin'}`}>
              {ready && <svg className="w-4 h-4 text-[#00ffff]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <p className="text-[10px] text-[#00ffff] font-orbitron tracking-[0.15em] uppercase leading-relaxed">
              {ready ? 'MATRIZ DE COMPONENTES COMPLETADA.\nLISTO PARA SIMULACIÓN DE ENSAMBLAJE.' : 'SELECCIONA LOS COMPONENTES PRINCIPALES\nPARA HABILITAR EL ESCÁNER.'}
            </p>
          </div>

          <a 
            href="#"
            onClick={handleNavigate}
            className={`h-12 px-10 rounded-lg font-orbitron font-bold text-[11px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden ${
              ready
                ? 'bg-[#00ffff] text-black shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_35px_rgba(0,255,255,0.5)] cursor-pointer'
                : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed pointer-events-none'
            }`}
          >
            <span className="relative z-10">{isVerifying ? 'PROCESANDO...' : 'AUDITORÍA TOTAL'}</span>
          </a>
        </div>

      </div>
    </div>
  );
}