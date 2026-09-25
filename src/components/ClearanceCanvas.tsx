import React from 'react';

interface ClearanceCanvasProps {
  caseObj?: any;
  gpuObj?: any;
  caseData?: any;
  gpuData?: any;
  status?: string;
  lang?: string;
}

export const ClearanceCanvas: React.FC<ClearanceCanvasProps> = (props) => {
  const isEn = props.lang === 'en';
  const cData = props.caseObj || props.caseData;
  const gData = props.gpuObj || props.gpuData;

  if (!cData || !gData) {
    return (
      <div className="w-full py-8 text-center text-slate-500 font-mono text-xs">
        {isEn ? 'LOADING TECHNICAL VIEW...' : 'CARGANDO VISTA TÉCNICA...'}
      </div>
    );
  }

  const maxGpuLength = Number(cData.maxGpuLengthMM || cData.maxGpuLength || 360);
  const gpuLength = Number(gData.dimensions?.lengthMM || gData.dimensions?.length || gData.lengthMM || 300);
  const clearanceMM = Math.round(maxGpuLength - gpuLength);

  const isEngineIncompatible = props.status === 'RED';
  const compatible = !isEngineIncompatible && clearanceMM >= 0;

  let badgeText = `${clearanceMM >= 0 ? '+' : ''}${clearanceMM}mm`;
  if (isEngineIncompatible && clearanceMM >= 0) {
    badgeText = isEn ? 'INCOMPATIBLE' : 'INCOMPATIBLE';
  } else if (!compatible) {
    badgeText = `${clearanceMM}mm`;
  }

  const scale = 0.95;
  const caseWidth = Math.max(maxGpuLength + 80, 430) * scale;
  const caseHeight = 280 * scale;
  const gpuW = gpuLength * scale;
  const gpuH = 48 * scale;

  const fontStyle = { fontFamily: "'Zen Dots', sans-serif" };
  const strokeColor = compatible ? '#00FF66' : '#FF0055';

  return (
    <div className="w-full overflow-x-auto py-3">
      <svg 
        viewBox={`0 0 ${caseWidth + 80} ${caseHeight + 90}`} 
        className="w-full h-auto min-w-[550px] max-w-2xl mx-auto bg-slate-950/90 rounded-3xl border border-white/10 p-4 backdrop-blur-xl shadow-2xl"
      >
        <defs>
          <pattern id="dotGrid" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="rgba(255, 255, 255, 0.06)" />
          </pattern>
          <linearGradient id="gpuBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#dotGrid)" />

        <g transform="translate(40, 35)">
          <path d={`M 20 ${caseHeight} L 30 ${caseHeight + 10} L 60 ${caseHeight + 10} L 70 ${caseHeight} Z`} fill="#1e293b" stroke={strokeColor} strokeWidth="1" />
          <path d={`M ${caseWidth - 70} ${caseHeight} L ${caseWidth - 60} ${caseHeight + 10} L ${caseWidth - 30} ${caseHeight + 10} L ${caseWidth - 20} ${caseHeight} Z`} fill="#1e293b" stroke={strokeColor} strokeWidth="1" />

          <path 
            d={`M 15 0 L ${caseWidth - 15} 0 L ${caseWidth} 15 L ${caseWidth} ${caseHeight - 10} L ${caseWidth - 10} ${caseHeight} L 10 ${caseHeight} L 0 ${caseHeight - 10} L 0 15 Z`}
            fill="#050811" stroke={strokeColor} strokeWidth="2" 
          />
          <path d={`M ${caseWidth - 20} 20 L ${caseWidth - 8} 25 L ${caseWidth - 8} ${caseHeight - 50} L ${caseWidth - 20} ${caseHeight - 40} Z`} fill="rgba(255,255,255,0.03)" stroke="#334155" strokeWidth="1" />
          <line x1={caseWidth - 14} y1="30" x2={caseWidth - 14} y2={caseHeight - 50} stroke="#334155" strokeWidth="3" strokeDasharray="6 4" />
          
          <rect x="0" y={caseHeight - 45} width={caseWidth - 20} height="45" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
          <rect x={30 + gpuW - 15} y={caseHeight - 45} width="30" height="6" fill="#020408" stroke={strokeColor} strokeWidth="1" rx="2" />
          <rect x="30" y="25" width={caseWidth - 75} height={caseHeight - 80} fill="rgba(15, 23, 42, 0.4)" stroke="#1e293b" strokeWidth="1" rx="4" />
          <text x="40" y="40" fill="#475569" fontSize="8" style={fontStyle}>
            {isEn ? 'MOTHERBOARD ATX' : 'PLACA BASE ATX'}
          </text>
          <rect x="30" y={caseHeight - 100} width="160" height="7" fill="#020408" stroke="#334155" strokeWidth="1" rx="1" />

          <g transform={`translate(30, ${caseHeight - 140})`}>
            <rect x="-10" y="-8" width="10" height={gpuH + 20} fill="#334155" stroke="#64748b" strokeWidth="1" rx="2" />
            <rect x="0" y="0" width={gpuW} height={gpuH} fill="url(#gpuBodyGrad)" stroke={strokeColor} strokeWidth="2" rx="8" />
            <path d={`M 10 4 L ${gpuW - 10} 4 L ${gpuW - 20} ${gpuH - 4} L 20 ${gpuH - 4} Z`} fill="none" stroke={strokeColor} strokeWidth="1" opacity="0.4" />
            
            <line x1="25" y1="12" x2={gpuW - 25} y2="12" stroke="#64748b" strokeWidth="4" strokeDasharray="3 3" opacity="0.7" />
            <line x1="25" y1={gpuH - 12} x2={gpuW - 25} y2={gpuH - 12} stroke="#64748b" strokeWidth="4" strokeDasharray="3 3" opacity="0.7" />
            
            <text x={gpuW / 2} y={gpuH / 2} fill="#ffffff" textAnchor="middle" dominantBaseline="middle" fontSize="9" style={fontStyle}>
              {gData.brand} {gData.model}
            </text>

            <rect x={gpuW - 65} y="-8" width="26" height="8" fill="#020408" stroke={strokeColor} strokeWidth="1.5" rx="2" />
            <g stroke={strokeColor} strokeWidth="2" fill="none" opacity="0.95" strokeLinecap="round">
              <path d={`M ${gpuW - 58} -8 C ${gpuW - 58} -28, ${gpuW - 5} 10, ${gpuW - 5} 95`} />
              <path d={`M ${gpuW - 52} -8 C ${gpuW - 52} -31, ${gpuW} 10, ${gpuW} 95`} />
              <path d={`M ${gpuW - 46} -8 C ${gpuW - 46} -34, ${gpuW + 5} 10, ${gpuW + 5} 95`} />
            </g>
            <rect x={gpuW - 40} y="-20" width="18" height="4" fill="#020408" stroke={strokeColor} strokeWidth="1" rx="1" transform={`rotate(-15 ${gpuW - 40} -20)`} />
          </g>

          <g transform={`translate(${30 + gpuW}, ${caseHeight - 116})`}>
            <line x1="5" y1="0" x2={Math.max(5, caseWidth - 35 - gpuW)} y2="0" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="3 3" />
            <g transform={`translate(${Math.max(0, (caseWidth - 40 - gpuW) / 2 - 45)}, -28)`}>
              <rect x="0" y="0" width="90" height="22" fill="#020408" stroke={strokeColor} strokeWidth="1.5" rx="6" />
              <text x="45" y="14" fill={strokeColor} fontSize="8" style={fontStyle} textAnchor="middle">
                {badgeText}
              </text>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};