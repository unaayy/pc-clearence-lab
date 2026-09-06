import React from 'react';
import type { Case, GPU, AIO, ClearanceResult } from '../types/hardware';

interface ClearanceCanvasProps {
  caseObj: Case;
  gpuObj: GPU;
  aioObj?: AIO;
  result: ClearanceResult;
}

export const ClearanceCanvas: React.FC<ClearanceCanvasProps> = ({ caseObj, gpuObj, aioObj, result }) => {
  const SCALE = 2;

  const canvasWidth = caseObj.maxGpuLengthMM * SCALE;
  const canvasHeight = caseObj.internalWidthMM * SCALE;

  const aioThicknessPx = (aioObj ? aioObj.totalThicknessMM : 25) * SCALE;
  const gpuLengthPx = gpuObj.dimensions.lengthMM * SCALE;
  const gpuWidthPx = gpuObj.dimensions.widthMM * SCALE;

  const colors = {
    GREEN: { stroke: '#00FF66', fill: 'rgba(0, 255, 102, 0.15)', text: '#00FF66' },
    YELLOW: { stroke: '#FFCC00', fill: 'rgba(255, 204, 0, 0.15)', text: '#FFCC00' },
    RED: { stroke: '#FF0055', fill: 'rgba(255, 0, 85, 0.25)', text: '#FF0055' }
  };

  const currentColor = colors[result.status];

  const gpuConnectorX = aioThicknessPx + gpuLengthPx * 0.7;
  const gpuConnectorY = canvasHeight - gpuWidthPx;
  const panelY = 0;

  const cablePath = `M ${gpuConnectorX} ${gpuConnectorY} C ${gpuConnectorX} ${gpuConnectorY - 20}, ${gpuConnectorX + 20} ${panelY + 10}, ${gpuConnectorX + 40} ${panelY}`;

  return (
    <div className="w-full flex flex-col items-center justify-center p-8 bg-[#0B0F17] rounded-xl border border-white/10 backdrop-blur-md relative overflow-hidden shadow-2xl">
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#00F0FF 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      <div className="z-10 mb-6 flex justify-between items-center w-full max-w-3xl">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Vista de Planta (2D) - Escala 1mm = 2px
        </span>
        <span className="text-xs font-mono font-bold px-3 py-1.5 rounded border border-white/20 shadow-sm" style={{ color: currentColor.text, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          STATUS: {result.status}
        </span>
      </div>

      <div className="relative overflow-auto max-w-full p-4 flex justify-center w-full z-10">
        <svg
          width={canvasWidth + 60}
          height={canvasHeight + 60}
          viewBox={`-30 -30 ${canvasWidth + 60} ${canvasHeight + 60}`}
          className="transition-all duration-300 ease-in-out"
        >
          <rect
            x="0"
            y="0"
            width={canvasWidth}
            height={canvasHeight}
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2"
            strokeDasharray="8 6"
            className="opacity-60"
          />
          <text x="5" y="-10" fill="#00F0FF" fontSize="12" className="font-mono opacity-80">
            Panel de Cristal Lateral
          </text>
          <text x="5" y={canvasHeight + 20} fill="#00F0FF" fontSize="12" className="font-mono opacity-80">
            Placa Base / Bandeja
          </text>

          <g className="transition-all duration-300">
            <rect
              x="0"
              y="0"
              width={aioThicknessPx}
              height={canvasHeight}
              fill="rgba(0, 240, 255, 0.1)"
              stroke="#00F0FF"
              strokeWidth="1"
            />
            <text
              x={aioThicknessPx / 2}
              y={canvasHeight / 2}
              fill="#00F0FF"
              fontSize="12"
              className="font-mono font-bold"
              textAnchor="middle"
              transform={`rotate(-90 ${aioThicknessPx / 2} ${canvasHeight / 2})`}
            >
              {aioObj ? aioObj.model : 'Frontal'} ({aioObj ? aioObj.totalThicknessMM : 25}mm)
            </text>
          </g>

          <rect
            x={aioThicknessPx}
            y={canvasHeight - gpuWidthPx}
            width={gpuLengthPx}
            height={gpuWidthPx}
            fill={currentColor.fill}
            stroke={currentColor.stroke}
            strokeWidth="2"
            className={`transition-all duration-300 ${result.status === 'RED' ? 'animate-pulse' : ''}`}
            rx="4"
          />
          <text
            x={aioThicknessPx + gpuLengthPx / 2}
            y={canvasHeight - gpuWidthPx / 2}
            fill="#FFFFFF"
            fontSize="14"
            className="font-mono font-bold drop-shadow-md"
            textAnchor="middle"
          >
            {gpuObj.brand} {gpuObj.model}
          </text>

          <path
            d={cablePath}
            fill="none"
            stroke={currentColor.stroke}
            strokeWidth="4"
            strokeDasharray={result.status === 'YELLOW' ? '6 4' : 'none'}
            className="transition-all duration-500"
          />

          {result.status === 'RED' && (
            <circle
              cx={aioThicknessPx + gpuLengthPx}
              cy={canvasHeight - gpuWidthPx / 2}
              r="10"
              fill="#FF0055"
              className="animate-ping opacity-75"
            />
          )}
        </svg>
      </div>
    </div>
  );
};