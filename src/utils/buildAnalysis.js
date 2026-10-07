// src/utils/buildAnalysis.js
// Lógica pura (sin React) de validación de compatibilidad y de recomendaciones de solución.
// Se invoca desde FullPcAnalyzer dentro de un useMemo para no recalcular en cada render.

const OK = '#10b981';
const BAD = '#f43f5e';
const WARN = '#fbbf24';

// Escalones comerciales habituales de PSU
const PSU_TIERS = [450, 550, 650, 750, 850, 1000, 1200, 1300, 1600];

const roundUp = (n, step) => Math.ceil(n / step) * step;

export function analyzeBuild(build, isEn = false) {
  const t = (en, es) => (isEn ? en : es);

  // --- Potencia ---
  const cpuTdp = build.cpu?.tdp || 120;
  const gpuTdp = build.gpu?.tdp || 250;
  const rawPower = cpuTdp + gpuTdp + 80;
  const reqPower = Math.ceil(rawPower * 1.25);
  const psuPower = build.psu?.wattage || 0;
  const psuOk = build.psu ? psuPower >= reqPower : false;

  // --- GPU / caja ---
  const gpuLen = build.gpu?.lengthMM || 0;
  const caseMaxGpu = build.case?.maxGpuLengthMM || 0;
  const gpuOk = build.gpu && build.case ? (caseMaxGpu > 0 ? gpuLen <= caseMaxGpu : true) : false;

  // --- Cable / cristal ---
  const caseWidthCap = build.case?.maxCpuCoolerHeightMM || 165;
  const gpuWidth = build.gpu?.widthMM || 135;
  const cableClearance = caseWidthCap - gpuWidth;
  // Solo recomendamos solucionar el cableado si ambos datos son reales (no valores por defecto)
  const cableDataReal = Boolean(build.gpu?.widthMM && build.case?.maxCpuCoolerHeightMM);

  let cableCritical = false;
  let cableWarning = false;
  let cableColorHex = OK;
  let cableDesc = t('Pending GPU or Case', 'Pendiente de GPU o Chasis');

  if (build.gpu && build.case) {
    if (cableClearance < 20) {
      cableCritical = true;
      cableColorHex = BAD;
      cableDesc = t(
        `Glass panel collision: ${Math.round(cableClearance)}mm clearance. Wider case required.`,
        `Choque contra cristal: ${Math.round(cableClearance)}mm de margen. Necesitas caja más ancha.`
      );
    } else if (cableClearance < 35) {
      cableWarning = true;
      cableColorHex = WARN;
      cableDesc = t(
        `Forced bend: ${Math.round(cableClearance)}mm free. Use 90º angled adapter.`,
        `Cierre forzado: ${Math.round(cableClearance)}mm libres. Usa cable acodado a 90º.`
      );
    } else {
      cableDesc = t(
        `Safe side clearance: ${Math.round(cableClearance)}mm free to glass.`,
        `Holgura lateral segura: ${Math.round(cableClearance)}mm libres hasta el cristal.`
      );
    }
  }

  // --- Refrigeración ---
  let coolerOk = false;
  let coolerDesc = t('Missing Cooler or Case', 'Falta Disipador o Chasis');
  if (build.cooler && build.case) {
    if (build.cooler.isLiquid) {
      coolerOk = (build.cooler.radiatorSizeMM || 240) <= 360;
      coolerDesc = t(
        `AIO Radiator: ${build.cooler.radiatorSizeMM || 240}mm. Case limit OK.`,
        `Radiador AIO: ${build.cooler.radiatorSizeMM || 240}mm. Límite chasis OK.`
      );
    } else {
      const height = build.cooler.heightMM || 155;
      coolerOk = height <= (build.case.maxCpuCoolerHeightMM || 999);
      coolerDesc = t(
        `Tower: ${height}mm. Limit: ${build.case.maxCpuCoolerHeightMM || 165}mm.`,
        `Torre: ${height}mm. Límite: ${build.case.maxCpuCoolerHeightMM || 165}mm.`
      );
    }
  }

  // --- Socket ---
  // Si falta el dato de socket en CPU o placa, no se puede verificar: no lo tratamos como error.
  const socketKnown = Boolean(build.cpu?.socket && build.mb?.socket);
  const socketOk = build.cpu && build.mb && socketKnown ? build.cpu.socket === build.mb.socket : true;

  const ramOk = Boolean(build.ram);
  const storageOk = Boolean(build.storage);

  const allClear = psuOk && gpuOk && coolerOk && socketOk && ramOk && storageOk && !cableCritical;
  const mainStatusColor = allClear ? OK : BAD;
  const statusMessage = allClear
    ? t('BUILD FULLY VIABLE', 'ENSAMBLAJE TOTALMENTE VIABLE')
    : t('INCOMPATIBILITY OR STRUCTURAL RISK', 'INCOMPATIBILIDAD O RIESGO ESTRUCTURAL');

  const isAIO = build.cooler?.isLiquid;

  const gpuWidthSvg = gpuLen > 330 ? 240 : 200;
  const gpuX = 60;
  const connectorX = gpuX + gpuWidthSvg - 30;

  const bothPresent = build.cpu && build.mb;
  const complianceChecks = [
    {
      key: 'gpu',
      t: t('GPU LENGTH CLEARANCE', 'HOLGURA LONGITUD (GPU)'),
      ok: gpuOk,
      c: gpuOk ? OK : BAD,
      d: build.gpu && build.case
        ? caseMaxGpu > 0
          ? `${t('Length', 'Longitud')}: ${gpuLen}mm | ${t('Max', 'Máx')}: ${caseMaxGpu}mm`
          : `${t('Length', 'Longitud')}: ${gpuLen}mm | ${t('Max: no data (assumed ok)', 'Máx: sin dato (asumido compatible)')}`
        : t('Pending', 'Pendiente'),
    },
    { key: 'cable', t: t('CABLE & GLASS CLEARANCE', 'CABLEADO Y CRISTAL (ANCHO)'), ok: !cableCritical, c: cableColorHex, d: cableDesc },
    {
      key: 'power',
      t: t('POWER SUPPLY CAPACITY', 'SUMINISTRO ENERGÉTICO'),
      ok: psuOk,
      c: psuOk ? OK : BAD,
      d: build.psu ? `${t('Demand', 'Demanda')}: ${reqPower}W | PSU: ${psuPower}W` : t('Pending', 'Pendiente'),
    },
    { key: 'cooling', t: t('COOLING CLEARANCE', 'ESPACIO REFRIGERACIÓN'), ok: coolerOk, c: coolerOk ? OK : BAD, d: coolerDesc },
    {
      key: 'socket',
      t: t('SOCKET COMPATIBILITY', 'COMPATIBILIDAD SOCKET'),
      ok: socketOk,
      c: socketOk ? OK : BAD,
      d: bothPresent
        ? !socketKnown
          ? t('No socket data (not verified)', 'Sin dato de socket (no verificado)')
          : socketOk
            ? t('Matching LGA/AM', 'LGA/AM Coincidente')
            : t('Incompatible', 'Incompatible')
        : t('Pending', 'Pendiente'),
    },
  ];

  return {
    cpuTdp, gpuTdp, reqPower, psuPower, psuOk,
    gpuLen, caseMaxGpu, gpuOk,
    caseWidthCap, gpuWidth, cableClearance, cableDataReal, cableCritical, cableWarning, cableColorHex, cableDesc,
    coolerOk, coolerDesc,
    socketKnown, socketOk, ramOk, storageOk,
    allClear, mainStatusColor, statusMessage, isAIO,
    gpuWidthSvg, gpuX, connectorX,
    complianceChecks,
  };
}

/**
 * Recomendaciones de solución por cada incompatibilidad / riesgo detectado.
 * Devuelve un objeto indexado por la `key` del check (gpu, cable, power, cooling, socket):
 *   { severity: 'error' | 'warn', title, message, actions: [{ label, query }] }
 * `label` es el texto del botón SIN el nombre de la tienda; la tienda se añade al renderizar.
 */
export function getRecommendations(build, a, isEn = false) {
  const t = (en, es) => (isEn ? en : es);
  const recs = {};

  // 1) GPU demasiado larga para la caja
  if (build.gpu && build.case && !a.gpuOk) {
    const needed = roundUp(a.gpuLen + 10, 10);
    recs.gpu = {
      severity: 'error',
      title: t('GPU DOES NOT FIT', 'LA GPU NO CABE'),
      message: t(
        `Your GPU is ${a.gpuLen}mm and the case only fits ${a.caseMaxGpu}mm (${a.gpuLen - a.caseMaxGpu}mm short).`,
        `Tu GPU mide ${a.gpuLen}mm y la caja solo admite ${a.caseMaxGpu}mm (faltan ${a.gpuLen - a.caseMaxGpu}mm).`
      ),
      actions: [
        {
          label: t('Search cases compatible with your GPU on', 'Buscar torres compatibles con tu GPU en'),
          query: t(`ATX PC case GPU clearance ${needed}mm`, `caja torre ATX PC gráfica hasta ${needed}mm`),
        },
        {
          label: t('Search more compact alternative GPUs on', 'Buscar GPUs alternativas más compactas en'),
          query: `${build.gpu.brand || ''} ${build.gpu.model || ''} ${t('compact', 'compacta')}`.trim(),
        },
      ],
    };
  }

  // 2) Cable contra el cristal (error si <20mm, aviso si 20-35mm) — solo con datos reales
  if (build.gpu && build.case && a.cableDataReal && (a.cableCritical || a.cableWarning)) {
    const connector = build.gpu.connectorType || '12VHPWR';
    recs.cable = {
      severity: a.cableCritical ? 'error' : 'warn',
      title: a.cableCritical ? t('GLASS COLLISION RISK', 'RIESGO DE CHOQUE CON EL CRISTAL') : t('CABLE BENDING RISK', 'RIESGO DE DOBLADO DE CABLE'),
      message: t(
        `Only ${Math.round(a.cableClearance)}mm between the GPU and the side panel. A 90º connector avoids stressing the cable.`,
        `Solo hay ${Math.round(a.cableClearance)}mm entre la GPU y el panel lateral. Un conector a 90º evita forzar el cable.`
      ),
      actions: [
        {
          label: t('Search 90º angled power adapters on', 'Buscar adaptadores de alimentación a 90º en'),
          query: t(`${connector} 90 degree adapter`, `adaptador ${connector} 90 grados`),
        },
        ...(a.cableCritical
          ? [{
              label: t('Search wider cases on', 'Buscar cajas más anchas en'),
              query: t('PC case wide side panel clearance cable management', 'caja PC ancha espacio lateral gestión de cables'),
            }]
          : []),
      ],
    };
  }

  // 3) Fuente insuficiente
  if (build.psu && !a.psuOk) {
    const target = PSU_TIERS.find((w) => w >= a.reqPower) || roundUp(a.reqPower, 100);
    recs.power = {
      severity: 'error',
      title: t('INSUFFICIENT POWER SUPPLY', 'FUENTE INSUFICIENTE'),
      message: t(
        `Estimated peak demand is ${a.reqPower}W and your PSU delivers ${a.psuPower}W. You need at least ${target}W.`,
        `La demanda pico estimada es ${a.reqPower}W y tu fuente entrega ${a.psuPower}W. Necesitas al menos ${target}W.`
      ),
      actions: [
        {
          label: t(`Search ${target}W 80+ Gold PSUs on`, `Buscar fuentes de ${target}W 80+ Gold en`),
          query: t(`${target}W 80 Plus Gold ATX power supply`, `fuente alimentación ${target}W 80 Plus Gold ATX`),
        },
        {
          label: t(`Search ${target}W modular ATX 3.0 PSUs on`, `Buscar fuentes modulares ATX 3.0 de ${target}W en`),
          query: t(`${target}W modular ATX 3.0 power supply`, `fuente modular ATX 3.0 ${target}W`),
        },
      ],
    };
  }

  // 4) Refrigeración que no cabe
  if (build.cooler && build.case && !a.coolerOk) {
    if (build.cooler.isLiquid) {
      recs.cooling = {
        severity: 'error',
        title: t('RADIATOR TOO LARGE', 'RADIADOR DEMASIADO GRANDE'),
        message: t(
          `The ${build.cooler.radiatorSizeMM}mm radiator exceeds the supported 360mm.`,
          `El radiador de ${build.cooler.radiatorSizeMM}mm supera los 360mm admitidos.`
        ),
        actions: [
          { label: t('Search 240/360mm AIO coolers on', 'Buscar refrigeración líquida AIO 240/360mm en'), query: t('AIO liquid cooler 360mm', 'refrigeración líquida AIO 360mm') },
          { label: t('Search low-profile air coolers on', 'Buscar disipadores de aire en'), query: t('CPU air cooler tower', 'disipador CPU torre aire') },
        ],
      };
    } else {
      const limit = build.case.maxCpuCoolerHeightMM || 165;
      recs.cooling = {
        severity: 'error',
        title: t('COOLER TOO TALL', 'DISIPADOR DEMASIADO ALTO'),
        message: t(
          `The tower is ${build.cooler.heightMM || 155}mm tall and the case allows ${limit}mm.`,
          `La torre mide ${build.cooler.heightMM || 155}mm y la caja admite ${limit}mm.`
        ),
        actions: [
          {
            label: t('Search low-profile coolers on', 'Buscar disipadores de perfil bajo en'),
            query: t(`CPU cooler low profile max ${limit - 5}mm`, `disipador CPU perfil bajo ${limit - 5}mm`),
          },
          { label: t('Search AIO liquid coolers on', 'Buscar refrigeración líquida AIO en'), query: t('AIO liquid cooler 240mm', 'refrigeración líquida AIO 240mm') },
        ],
      };
    }
  }

  // 5) Socket CPU / placa distinto (solo si hay datos de ambos)
  if (build.cpu && build.mb && a.socketKnown && !a.socketOk) {
    recs.socket = {
      severity: 'error',
      title: t('SOCKET MISMATCH', 'SOCKET INCOMPATIBLE'),
      message: t(
        `The CPU uses ${build.cpu.socket} and the motherboard ${build.mb.socket}. There is no adapter: change one of them.`,
        `La CPU usa ${build.cpu.socket} y la placa ${build.mb.socket}. No existe adaptador: cambia una de las dos piezas.`
      ),
      actions: [
        {
          label: t(`Search ${build.cpu.socket} motherboards on`, `Buscar placas base ${build.cpu.socket} en`),
          query: t(`${build.cpu.socket} motherboard`, `placa base socket ${build.cpu.socket}`),
        },
        {
          label: t(`Search ${build.mb.socket} processors on`, `Buscar procesadores ${build.mb.socket} en`),
          query: t(`${build.mb.socket} processor CPU`, `procesador CPU socket ${build.mb.socket}`),
        },
      ],
    };
  }

  return recs;
}
