import type { Case, GPU, AIO, ClearanceResult } from '../types/hardware';

export function calculateClearance(caseObj: Case, gpuObj: GPU, aioObj?: AIO): ClearanceResult {
  const warnings: string[] = [];
  const frontDiscount = aioObj ? aioObj.totalThicknessMM : 25;
  
  const frontMarginMM = caseObj.maxGpuLengthMM - frontDiscount - gpuObj.dimensions.lengthMM;
  const lateralMarginMM = caseObj.internalWidthMM - gpuObj.dimensions.widthMM;

  let status: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';

  if (frontMarginMM < 0) {
    status = 'RED';
    warnings.push(`Colisión frontal: Faltan ${Math.abs(Number(frontMarginMM.toFixed(1)))}mm para que la GPU quepa con el AIO/Ventiladores frontales.`);
  } else if (frontMarginMM < 10) {
    status = 'YELLOW';
    warnings.push(`Espacio frontal crítico: Solo quedan ${Number(frontMarginMM.toFixed(1))}mm. El paso de cables o tubos del AIO puede ser muy complicado.`);
  }

  if (gpuObj.connectorType === '12VHPWR') {
    if (lateralMarginMM < 15) {
      status = 'RED';
      warnings.push(`Colisión lateral: El cristal no cerrará. El conector 12VHPWR necesita mínimo 15mm con adaptador, y solo tienes ${Number(lateralMarginMM.toFixed(1))}mm.`);
    } else if (lateralMarginMM < 35) {
      if (status !== 'RED') status = 'YELLOW';
      warnings.push(`Riesgo de doblado 12VHPWR: Tienes ${Number(lateralMarginMM.toFixed(1))}mm de margen lateral. Se recomienda encarecidamente un adaptador de 90° para evitar tensión en el cable.`);
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
    warnings.push('Todos los componentes encajan perfectamente con márgenes seguros.');
  }

  return {
    frontMarginMM: Number(frontMarginMM.toFixed(1)),
    lateralMarginMM: Number(lateralMarginMM.toFixed(1)),
    status,
    warnings
  };
}