// Ubicación original: src/components/<carpeta>/AffiliateBanners.tsx
// Si tu carpeta tiene otra profundidad, ajusta el import de SmartAffiliateCTA.
import React from 'react';
import type { Case, GPU, ClearanceResult } from '../../types/hardware';
import { SmartAffiliateCTA } from '../SmartAffiliateCTA';

interface AffiliateBannersProps {
  result: ClearanceResult;
  gpuObj: GPU;
  caseObj: Case;
  lang?: string;
}

export const AffiliateBanners: React.FC<AffiliateBannersProps> = ({ result, gpuObj, caseObj, lang }) => {
  const isEn = lang === 'en' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/en'));

  const wrapper = (border: string, bg: string) =>
    `w-full mt-6 ${bg} border ${border} rounded-xl p-5 backdrop-blur-sm flex flex-col gap-4`;

  if (result.status === 'GREEN') {
    // Un único CTA: la GPU es el componente de mayor valor
    return (
      <div className={wrapper('border-[#00FF66]/30', 'bg-[#00FF66]/10')}>
        <div>
          <h3 className="text-[#00FF66] font-bold text-lg mb-1">
            {isEn ? 'Verified Compatibility' : 'Compatibilidad Verificada'}
          </h3>
          <p className="text-slate-300 text-sm">
            {isEn
              ? 'This combination fits perfectly with ample clearance. If you are ready to build your PC, you can check component availability below.'
              : 'Esta combinación encaja perfectamente y tienes espacio suficiente. Si estás listo para montar tu PC, puedes consultar la disponibilidad de estos componentes.'}
          </p>
        </div>
        <SmartAffiliateCTA isEn={isEn} query={`${gpuObj.brand} ${gpuObj.model}`} />
      </div>
    );
  }

  if (result.status === 'YELLOW') {
    return (
      <div className={wrapper('border-[#FFCC00]/30', 'bg-[#FFCC00]/10')}>
        <div>
          <h3 className="text-[#FFCC00] font-bold text-lg mb-1">
            {isEn ? 'Caution: Cable Bending Risk' : 'Precaución: Riesgo de doblado de cable'}
          </h3>
          <p className="text-slate-300 text-sm">
            {isEn
              ? `Lateral clearance of ${result.lateralMarginMM}mm will force the ${gpuObj.connectorType} connector against the glass. Avoid risks using a 90-degree adapter.`
              : `El margen lateral de ${result.lateralMarginMM}mm forzará el conector ${gpuObj.connectorType} contra el cristal. Evita riesgos usando un adaptador acodado a 90 grados.`}
          </p>
        </div>
        <SmartAffiliateCTA isEn={isEn} query={isEn ? '12vhpwr 90 degree adapter' : 'adaptador 12vhpwr 90 grados'} />
      </div>
    );
  }

  if (result.status === 'RED') {
    // Alternativa más accesible: versión compacta de la misma GPU
    return (
      <div className={wrapper('border-[#FF0055]/30', 'bg-[#FF0055]/10')}>
        <div>
          <h3 className="text-[#FF0055] font-bold text-lg mb-1">
            {isEn ? 'Physical Incompatibility Detected' : 'Incompatibilidad Física Detectada'}
          </h3>
          <p className="text-slate-300 text-sm">
            {isEn
              ? 'This combination does not fit. You can opt for a smaller graphics card model or a PC case with larger clearance.'
              : 'Esta combinación no encaja. Puedes optar por una versión más pequeña de la gráfica o una caja con mayor holgura.'}
          </p>
        </div>
        <SmartAffiliateCTA isEn={isEn} query={`${gpuObj.brand} ${gpuObj.model} ${isEn ? 'compact' : 'compacta'}`} />
      </div>
    );
  }

  return null;
};
