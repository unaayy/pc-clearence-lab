import React, { useState } from 'react';

export default function SearchInterface({ cases = [], gpus = [] }) {
  const [caseQuery, setCaseQuery] = useState('');
  const [gpuQuery, setGpuQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedGpu, setSelectedGpu] = useState(null);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [showGpuDropdown, setShowGpuDropdown] = useState(false);

  const fontStyle = { fontFamily: "'Zen Dots', sans-serif" };

  const filteredCases = caseQuery
    ? cases.filter((c) => `${c.brand} ${c.model}`.toLowerCase().includes(caseQuery.toLowerCase()))
    : cases;

  const filteredGpus = gpuQuery
    ? gpus.filter((g) => `${g.brand} ${g.model}`.toLowerCase().includes(gpuQuery.toLowerCase()))
    : gpus;

  const handleCompare = (e) => {
    e.preventDefault();
    if (selectedCase && selectedGpu) {
      window.location.href = `/${selectedCase.slug}-vs-${selectedGpu.slug}`;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleCompare} className="relative space-y-3.5 bg-black/60 p-4 sm:p-6 rounded-3xl border border-white/15 backdrop-blur-xl shadow-[0_0_50px_rgba(0,240,255,0.05)]">
        
        {/* Input 1: Caja */}
        <div className="relative">
          <label 
            style={fontStyle} 
            className="text-[11px] tracking-wider uppercase text-cyan-400 mb-1.5 block pl-3"
          >
            01 // SELECCIONAR CAJA
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              style={fontStyle}
              value={selectedCase ? `${selectedCase.brand} ${selectedCase.model}` : caseQuery}
              onChange={(e) => {
                setCaseQuery(e.target.value);
                setSelectedCase(null);
                setShowCaseDropdown(true);
              }}
              onFocus={() => setShowCaseDropdown(true)}
              placeholder="Escribe tu caja..."
              className="w-full bg-slate-950/90 border border-white/15 focus:border-[#00F0FF] text-white text-[11px] sm:text-[13px] rounded-2xl px-4 py-3.5 pr-10 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] transition-all placeholder:text-slate-600"
            />
            {selectedCase && (
              <button
                type="button"
                onClick={() => { setSelectedCase(null); setCaseQuery(''); }}
                className="absolute right-4 text-slate-400 hover:text-white text-[11px] bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center font-sans"
              >
                ✕
              </button>
            )}
          </div>

          {/* Desplegable Cajas */}
          {showCaseDropdown && !selectedCase && (
            <div className="absolute z-30 w-full mt-1 bg-slate-950/95 border border-white/15 rounded-2xl max-h-52 overflow-y-auto backdrop-blur-2xl shadow-2xl">
              {filteredCases.length > 0 ? (
                filteredCases.map((c) => (
                  <div
                    key={c.slug}
                    onClick={() => {
                      setSelectedCase(c);
                      setShowCaseDropdown(false);
                    }}
                    className="p-3.5 text-[11px] text-slate-200 hover:text-black hover:bg-[#00F0FF] cursor-pointer flex justify-between items-center transition-colors border-b border-white/5 last:border-0"
                  >
                    <span style={fontStyle} className="text-[11px]">{c.brand} {c.model}</span>
                    <span className="text-[9px] font-mono font-bold opacity-70">Max {c.maxGpuLengthMM}mm</span>
                  </div>
                ))
              ) : (
                <div className="p-3.5 text-[11px] text-slate-500 font-mono">Sin coincidencias</div>
              )}
            </div>
          )}
        </div>

        {/* Separador VS */}
        <div className="flex items-center justify-center -my-1 z-10 relative">
          <div className="bg-slate-950 border border-[#00F0FF]/40 text-[#00F0FF] text-[11px] px-3.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(0,240,255,0.3)]" style={fontStyle}>
            VS
          </div>
        </div>

        {/* Input 2: Tarjeta Gráfica */}
        <div className="relative">
          <label 
            style={fontStyle} 
            className="text-[11px] tracking-wider uppercase text-emerald-400 mb-1.5 block pl-3"
          >
            02 // SELECCIONAR TARJETA GRÁFICA
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              style={fontStyle}
              value={selectedGpu ? `${selectedGpu.brand} ${selectedGpu.model}` : gpuQuery}
              onChange={(e) => {
                setGpuQuery(e.target.value);
                setSelectedGpu(null);
                setShowGpuDropdown(true);
              }}
              onFocus={() => setShowGpuDropdown(true)}
              placeholder="Escribe tu GPU..."
              className="w-full bg-slate-950/90 border border-white/15 focus:border-emerald-400 text-white text-[11px] sm:text-[13px] rounded-2xl px-4 py-3.5 pr-10 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all placeholder:text-slate-600"
            />
            {selectedGpu && (
              <button
                type="button"
                onClick={() => { setSelectedGpu(null); setGpuQuery(''); }}
                className="absolute right-4 text-slate-400 hover:text-white text-[11px] bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center font-sans"
              >
                ✕
              </button>
            )}
          </div>

          {/* Desplegable GPUs */}
          {showGpuDropdown && !selectedGpu && (
            <div className="absolute z-20 w-full mt-1 bg-slate-950/95 border border-white/15 rounded-2xl max-h-52 overflow-y-auto backdrop-blur-2xl shadow-2xl">
              {filteredGpus.length > 0 ? (
                filteredGpus.map((g) => (
                  <div
                    key={g.slug}
                    onClick={() => {
                      setSelectedGpu(g);
                      setShowGpuDropdown(false);
                    }}
                    className="p-3.5 text-[11px] text-slate-200 hover:text-black hover:bg-emerald-400 cursor-pointer flex justify-between items-center transition-colors border-b border-white/5 last:border-0"
                  >
                    <span style={fontStyle} className="text-[11px]">{g.brand} {g.model}</span>
                    <span className="text-[9px] font-mono font-bold opacity-70">{g.dimensions.lengthMM}mm</span>
                  </div>
                ))
              ) : (
                <div className="p-3.5 text-[11px] text-slate-500 font-mono">Sin coincidencias</div>
              )}
            </div>
          )}
        </div>

        {/* Botón Comparar */}
        <button
          type="submit"
          disabled={!selectedCase || !selectedGpu}
          style={fontStyle}
          className={`w-full mt-4 py-3.5 rounded-2xl text-[11px] sm:text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2.5 ${
            selectedCase && selectedGpu
              ? 'bg-[#00F0FF] text-black shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:bg-white cursor-pointer'
              : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-white/5'
          }`}
        >
          <span>VERIFICAR ESPACIO</span>
          <span className="text-base">→</span>
        </button>
      </form>
    </div>
  );
}