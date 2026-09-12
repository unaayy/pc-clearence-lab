import type { Case, GPU, AIO, ClearanceResult } from '../types/hardware';

// Extendemos la interfaz ClearanceResult si es necesario en tu types file, 
// o el motor la devolverá directamente:
export function calculateClearance(caseObj: Case, gpuObj: GPU, aioObj?: AIO) {
  const warnings: string[] = [];
  
  // Grosor del elemento frontal (AIO o ventiladores estándar de 25mm)
  const frontDiscount = aioObj ? aioObj.totalThicknessMM : 25;
  
  // Holgura Bruta (Espacio total del chasis sin contar ventiladores)
  const grossFrontMarginMM = caseObj.maxGpuLengthMM - gpuObj.dimensions.lengthMM;
  
  // Holgura Neta (Espacio libre restando los ventiladores/AIO frontal)
  const frontMarginMM = grossFrontMarginMM - frontDiscount;
  
  // Holgura Lateral
  const lateralMarginMM = caseObj.internalWidthMM - gpuObj.dimensions.widthMM;

  let status: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';

  // Evaluación del margen frontal neto
  if (frontMarginMM < 0) {
    status = 'RED';
    warnings.push(`Colisión frontal: Faltan ${Math.abs(Number(frontMarginMM.toFixed(1)))}mm para que la GPU quepa al restar los ${frontDiscount}mm de ventiladores/AIO frontales.`);
  } else if (frontMarginMM < 10) {
    status = 'YELLOW';
    warnings.push(`Espacio frontal crítico: Tras descontar ${frontDiscount}mm de ventilación frontal, solo quedan ${Number(frontMarginMM.toFixed(1))}mm libres.`);
  }

  // Evaluación del conector y margen lateral
  if (gpuObj.connectorType === '12VHPWR' || gpuObj.connectorType?.includes('16-pin')) {
    if (lateralMarginMM < 15) {
      status = 'RED';
      warnings.push(`Colisión lateral: El cristal no cerrará. El conector 12VHPWR necesita mínimo 15mm con adaptador acodado, y solo dispones de ${Number(lateralMarginMM.toFixed(1))}mm.`);
    } else if (lateralMarginMM < 35) {
      if (status !== 'RED') status = 'YELLOW';
      warnings.push(`Riesgo de doblado 12VHPWR: Tienes ${Number(lateralMarginMM.toFixed(1))}mm de margen lateral. Se recomienda un adaptador de 90° para evitar tensión.`);
    }
  } else {
    if (lateralMarginMM < 10) {
      status = 'RED';
      warnings.push(`Colisión lateral: Los cables PCIe de 8 pines chocarán con el cristal (Margen: ${Number(lateralMarginMM.toFixed(1))}mm).`);
    } else if (lateralMarginMM < 20) {
      if (status !== 'RED') status = 'YELLOW';
      warnings.push(`Espacio lateral ajustado para cables PCIe (Margen: ${Number(lateralMarginMM.toFixed(1))}mm).`);
    }
  }

  if (status === 'GREEN') {
    warnings.push(`Todos los componentes encajan perfectamente con márgenes seguros (Descontando ${frontDiscount}mm de ventilación frontal).`);
  }

  return {
    grossFrontMarginMM: Number(grossFrontMarginMM.toFixed(1)),
    frontMarginMM: Number(frontMarginMM.toFixed(1)),
    frontDiscount,
    lateralMarginMM: Number(lateralMarginMM.toFixed(1)),
    status,
    warnings
  };
}