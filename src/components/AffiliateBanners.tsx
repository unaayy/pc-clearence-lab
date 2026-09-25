import React from 'react';
import type { Case, GPU, ClearanceResult } from '../../types/hardware';

interface AffiliateBannersProps {
  result: ClearanceResult;
  gpuObj: GPU;
  caseObj: Case;
  lang?: string;
}
export const AffiliateBanners: React.FC<AffiliateBannersProps> = ({ result, gpuObj, caseObj }) => {
  const AMAZON_TAG = 'lidunax-21';
  const isEn = typeof window !== 'undefined' && window.location.pathname.startsWith('/en');

  if (result.status === 'GREEN') {
    // ...

  if (result.status === 'GREEN') {
    const gpuUrl = `https://www.amazon.es/s?k=${encodeURIComponent(gpuObj.brand + ' ' + gpuObj.model)}&tag=${AMAZON_TAG}`;
    const caseUrl = `https://www.amazon.es/s?k=${encodeURIComponent(caseObj.brand + ' ' + caseObj.model)}&tag=${AMAZON_TAG}`;

    return (
      <div className="w-full mt-6 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded-xl p-5 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-[#00FF66] font-bold text-lg mb-1 flex items-center gap-2">
            {isEn ? 'Verified Compatibility' : 'Compatibilidad Verificada'}
          </h3>
          <p className="text-slate-300 text-sm">
            {isEn 
              ? 'This combination fits perfectly with ample clearance. If you are ready to build your PC, you can check component availability below.'
              : 'Esta combinación encaja perfectamente y tienes espacio suficiente. Si estás listo para montar tu PC, puedes consultar la disponibilidad de estos componentes.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 min-w-[250px]">
          <a
            href={gpuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-center bg-white/5 hover:bg-white/10 border border-[#00FF66]/50 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {isEn ? `View ${gpuObj.brand} on Amazon` : `Ver ${gpuObj.brand} en Amazon`}
          </a>
          <a
            href={caseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-center bg-[#00FF66] hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(0,255,102,0.3)] text-sm"
          >
            {isEn ? `View ${caseObj.brand} Case on Amazon` : `Ver Caja ${caseObj.brand} en Amazon`}
          </a>
        </div>
      </div>
    );
  }

  if (result.status === 'YELLOW') {
    const adapterUrl = `https://www.amazon.es/s?k=adaptador+12vhpwr+90+grados&tag=${AMAZON_TAG}`;
    
    return (
      <div className="w-full mt-6 bg-[#FFCC00]/10 border border-[#FFCC00]/30 rounded-xl p-5 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-[#FFCC00] font-bold text-lg mb-1 flex items-center gap-2">
            {isEn ? 'Caution: Cable Bending Risk' : 'Precaución: Riesgo de doblado de cable'}
          </h3>
          <p className="text-slate-300 text-sm">
            {isEn 
              ? `Lateral clearance of ${result.lateralMarginMM}mm will force the ${gpuObj.connectorType} connector against the glass. Avoid risks using a 90-degree adapter.`
              : `El margen lateral de ${result.lateralMarginMM}mm forzará el conector ${gpuObj.connectorType} contra el cristal. Evita riesgos usando un adaptador acodado a 90 grados.`}
          </p>
        </div>
        <a
          href={adapterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-[#FFCC00] hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(255,204,0,0.3)] whitespace-nowrap text-sm"
        >
          {isEn ? 'View 90° adapters on Amazon' : 'Ver adaptadores 90° en Amazon'}
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
            {isEn ? 'Physical Incompatibility Detected' : 'Incompatibilidad Física Detectada'}
          </h3>
          <p className="text-slate-300 text-sm">
            {isEn 
              ? 'This combination does not fit. You can opt for a smaller graphics card model or a PC case with larger clearance.'
              : 'Esta combinación no encaja. Puedes optar por una versión más pequeña de la gráfica o una caja con mayor holgura.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 min-w-[250px]">
          <a
            href={compactGpuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-center bg-white/5 hover:bg-white/10 border border-[#FF0055]/50 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {isEn ? 'Search more compact GPUs' : 'Buscar GPUs más compactas'}
          </a>
          <a
            href={biggerCaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-center bg-[#FF0055] hover:bg-rose-600 text-white font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(255,0,85,0.4)] text-sm"
          >
            {isEn ? 'View larger PC Cases' : 'Ver Cajas más amplias'}
          </a>
        </div>
      </div>
    );
  }

  return null;
};