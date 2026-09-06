import React from 'react';
import type { Case, GPU, ClearanceResult } from '../types/hardware';

interface AffiliateBannersProps {
  result: ClearanceResult;
  gpuObj: GPU;
  caseObj: Case;
}

export const AffiliateBanners: React.FC<AffiliateBannersProps> = ({ result, gpuObj, caseObj }) => {
  if (result.status === 'GREEN') return null;

 const AMAZON_TAG = 'pcclearance-21';

  if (result.status === 'YELLOW') {
    const adapterUrl = `https://www.amazon.es/s?k=adaptador+12vhpwr+90+grados&tag=${AMAZON_TAG}`;
    
    return (
      <div className="w-full mt-6 bg-[#FFCC00]/10 border border-[#FFCC00]/30 rounded-xl p-5 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-[#FFCC00] font-bold text-lg mb-1 flex items-center gap-2">
            Precaución: Riesgo de doblado de cable
          </h3>
          <p className="text-slate-300 text-sm">
            El margen lateral de {result.lateralMarginMM}mm forzará el conector {gpuObj.connectorType} contra el cristal. Evita riesgos usando un adaptador acodado a 90 grados.
          </p>
        </div>
        <a
          href={adapterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-[#FFCC00] hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(255,204,0,0.3)] whitespace-nowrap text-sm"
        >
          Ver adaptadores 90° en Amazon
        </a>
      </div>
    );
  }

  if (result.status === 'RED') {
    const compactGpuUrl = `https://www.amazon.es/s?k=${encodeURIComponent(gpuObj.brand + ' ' + gpuObj.model + ' compacta')}&tag=${AMAZON_TAG}`;
    const biggerCaseUrl = `https://www.amazon.es/s?k=${encodeURIComponent('caja pc e-atx ' + caseObj.brand)}&tag=${AMAZON_TAG}`;

    return (
      <div className="w-full mt-6 bg-[#FF0055]/10 border border-[#FF0055]/30 rounded-xl p-5 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-[#FF0055] font-bold text-lg mb-1 flex items-center gap-2">
            Incompatibilidad Física Detectada
          </h3>
          <p className="text-slate-300 text-sm">
            Esta combinación no encaja. Puedes optar por una versión más pequeña de la gráfica o una caja con mayor holgura.
          </p>
        </div>
        <div className="flex flex-col gap-3 min-w-[250px]">
          <a
            href={compactGpuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-center bg-white/5 hover:bg-white/10 border border-[#FF0055]/50 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Buscar GPUs más compactas
          </a>
          <a
            href={biggerCaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-center bg-[#FF0055] hover:bg-rose-600 text-white font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(255,0,85,0.4)] text-sm"
          >
            Ver Cajas más amplias
          </a>
        </div>
      </div>
    );
  }

  return null;
};