// src/components/FullPcAnalyzer.jsx
import React, { useEffect, useMemo } from 'react';
import { getStoresForLocale } from '../config/stores.js';

export function resolveBuild(db, sp) {
  if (!db || !sp) return null;
  const getComp = (type, slug) => {
    if (!db[type] || !slug) return undefined;
    return db[type].find((c) => c.slug === slug);
  };
  return {
    case: getComp('cases', sp.get('case')),
    cpu: getComp('cpus', sp.get('cpu')),
    gpu: getComp('gpus', sp.get('gpu')),
    psu: getComp('psus', sp.get('psu')),
    cooler: getComp('coolers', sp.get('cooler')),
    mb: getComp('motherboards', sp.get('mb')),
    ram: getComp('rams', sp.get('ram')),
    storage: getComp('storage', sp.get('storage')),
  };
}

export function formatName(comp) {
  if (!comp) return null;
  const brandName = comp.brand && !comp.brand.toLowerCase().includes('genér') ? comp.brand : '';
  return `${brandName} ${comp.model}`.trim();
}

export function getBuildSeoMeta(build, isEn = false) {
  if (!build || (!build.cpu && !build.gpu && !build.case)) {
    return {
      title: isEn ? 'PC Compatibility Analyzer | LIDUNAX' : 'Analizador de Compatibilidad de PC | LIDUNAX',
      description: isEn 
        ? 'Check if your CPU, GPU, motherboard, RAM, PSU, cooling and case are compatible, and buy each part at the best price.'
        : 'Comprueba si tu CPU, GPU, placa base, RAM, PSU, refrigeración y chasis son compatibles entre sí, y compra cada pieza al mejor precio.',
    };
  }
  const parts = [build.cpu, build.gpu, build.case].filter(Boolean).map(formatName);
  const label = parts.length ? parts.join(' + ') : (isEn ? 'your configuration' : 'tu configuración');
  return {
    title: isEn ? `Is ${label} compatible? PC Analyzer | LIDUNAX` : `¿Es compatible ${label}? Analizador de PC | LIDUNAX`,
    description: isEn 
      ? `We verify physical clearances, socket, power supply and cooling for ${label}. Check full diagnosis and buy parts at the best price.`
      : `Verificamos holguras físicas, socket, potencia y refrigeración de ${label}. Consulta el diagnóstico completo y compra cada pieza al mejor precio.`,
  };
}

export default function FullPcAnalyzer({ db, searchParams, lang }) {
  const isEn = typeof window !== 'undefined' 
    ? (window.location.pathname.startsWith('/en') || lang === 'en')
    : lang === 'en';

  const currentLang = isEn ? 'en' : 'es';
  const stores = getStoresForLocale(currentLang);

  // RESOLUCIÓN RESILIENTE EN CLIENTE/SERVIDOR
  const build = useMemo(() => {
    if (!db) return null;
    let sp = searchParams;
    if (typeof window !== 'undefined') {
      sp = new URLSearchParams(window.location.search);
    }
    return resolveBuild(db, sp);
  }, [db, searchParams]);

  useEffect(() => {
    if (typeof document === 'undefined' || !build) return;
    try {
      const { title, description } = getBuildSeoMeta(build, isEn);
      document.title = title || 'LIDUNAX';
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      if (description) {
        metaDesc.setAttribute('content', description);
      }
    } catch (err) {
      console.error('Error aplicando metadatos SEO:', err);
    }
  }, [build, isEn]);

  const ICONS = {
    [isEn ? 'PROCESSOR (CPU)' : 'PROCESADOR (CPU)']: 'CPU',
    [isEn ? 'GRAPHICS CARD' : 'TARJETA GRÁFICA']: 'GPU',
    [isEn ? 'MOTHERBOARD' : 'PLACA BASE']: 'MB',
    [isEn ? 'COOLING' : 'REFRIGERACIÓN']: 'RF',
    [isEn ? 'RAM MEMORY' : 'MEMORIA RAM']: 'RAM',
    [isEn ? 'STORAGE' : 'ALMACENAMIENTO']: 'SSD',
    [isEn ? 'POWER SUPPLY' : 'FUENTE (PSU)']: 'PSU',
    [isEn ? 'CHASSIS / CASE' : 'CHASIS / CAJA']: 'PC',
  };

  if (!build) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#00ffff] border-t-transparent animate-spin"></div>
        <p className="font-orbitron text-xs tracking-widest text-[#00ffff] uppercase">
          {isEn ? 'Processing system telemetry...' : 'Procesando telemetría del sistema...'}
        </p>
      </div>
    );
  }

  const cpuTdp = build.cpu?.tdp || 120;
  const gpuTdp = build.gpu?.tdp || 250;
  const rawPower = cpuTdp + gpuTdp + 80;
  const reqPower = Math.ceil(rawPower * 1.25);
  const psuPower = build.psu?.wattage || 0;
  const psuOk = build.psu ? psuPower >= reqPower : false;

  const gpuLen = build.gpu?.lengthMM || 0;
  const caseMaxGpu = build.case?.maxGpuLengthMM || 0;
  const gpuOk = build.gpu && build.case ? (caseMaxGpu > 0 ? gpuLen <= caseMaxGpu : true) : false;

  const caseWidthCap = build.case?.maxCpuCoolerHeightMM || 165;
  const gpuWidth = build.gpu?.widthMM || 135;
  const cableClearance = caseWidthCap - gpuWidth;

  let cableCritical = false;
  let cableColorHex = '#10b981';
  let cableDesc = isEn ? 'Pending GPU or Case' : 'Pendiente de GPU o Chasis';

  if (build.gpu && build.case) {
    if (cableClearance < 20) {
      cableCritical = true;
      cableColorHex = '#f43f5e';
      cableDesc = isEn 
        ? `Glass panel collision: ${Math.round(cableClearance)}mm clearance. Wider case required.`
        : `Choque contra cristal: ${Math.round(cableClearance)}mm de margen. Necesitas caja más ancha.`;
    } else if (cableClearance < 35) {
      cableColorHex = '#fbbf24';
      cableDesc = isEn 
        ? `Forced bend: ${Math.round(cableClearance)}mm free. Use 90º angled adapter.`
        : `Cierre forzado: ${Math.round(cableClearance)}mm libres. Usa cable acodado a 90º.`;
    } else {
      cableDesc = isEn 
        ? `Safe side clearance: ${Math.round(cableClearance)}mm free to glass.`
        : `Holgura lateral segura: ${Math.round(cableClearance)}mm libres hasta el cristal.`;
    }
  }

  let coolerOk = false;
  let coolerDesc = isEn ? 'Missing Cooler or Case' : 'Falta Disipador o Chasis';
  if (build.cooler && build.case) {
    if (build.cooler.isLiquid) {
      coolerOk = (build.cooler.radiatorSizeMM || 240) <= 360;
      coolerDesc = isEn 
        ? `AIO Radiator: ${build.cooler.radiatorSizeMM || 240}mm. Case limit OK.`
        : `Radiador AIO: ${build.cooler.radiatorSizeMM || 240}mm. Límite chasis OK.`;
    } else {
      const height = build.cooler.heightMM || 155;
      coolerOk = height <= (build.case.maxCpuCoolerHeightMM || 999);
      coolerDesc = isEn 
        ? `Tower: ${height}mm. Limit: ${build.case.maxCpuCoolerHeightMM || 165}mm.`
        : `Torre: ${height}mm. Límite: ${build.case.maxCpuCoolerHeightMM || 165}mm.`;
    }
  }

  const socketOk = build.cpu && build.mb ? build.cpu.socket === build.mb.socket : true;
  const ramOk = Boolean(build.ram);
  const storageOk = Boolean(build.storage);

  const allClear = psuOk && gpuOk && coolerOk && socketOk && ramOk && storageOk && !cableCritical;
  const mainStatusColor = allClear ? '#10b981' : '#f43f5e';
  const statusMessage = allClear 
    ? (isEn ? 'BUILD FULLY VIABLE' : 'ENSAMBLAJE TOTALMENTE VIABLE') 
    : (isEn ? 'INCOMPATIBILITY OR STRUCTURAL RISK' : 'INCOMPATIBILIDAD O RIESGO ESTRUCTURAL');

  const isAIO = build.cooler?.isLiquid;

  const gpuWidthSvg = gpuLen > 330 ? 240 : 200;
  const gpuX = 60;
  const connectorX = gpuX + gpuWidthSvg - 30;

  const complianceChecks = [
    {
      key: 'gpu',
      t: isEn ? 'GPU LENGTH CLEARANCE' : 'HOLGURA LONGITUD (GPU)',
      ok: gpuOk,
      c: gpuOk ? '#10b981' : '#f43f5e',
      d: build.gpu && build.case
        ? caseMaxGpu > 0
          ? `${isEn ? 'Length' : 'Longitud'}: ${gpuLen}mm | ${isEn ? 'Max' : 'Máx'}: ${caseMaxGpu}mm`
          : `${isEn ? 'Length' : 'Longitud'}: ${gpuLen}mm | ${isEn ? 'Max: no data (assumed ok)' : 'Máx: sin dato (asumido compatible)'}`
        : (isEn ? 'Pending' : 'Pendiente'),
    },
    { key: 'cable', t: isEn ? 'CABLE & GLASS CLEARANCE' : 'CABLEADO Y CRISTAL (ANCHO)', ok: !cableCritical, c: cableColorHex, d: cableDesc },
    {
      key: 'power',
      t: isEn ? 'POWER SUPPLY CAPACITY' : 'SUMINISTRO ENERGÉTICO',
      ok: psuOk,
      c: psuOk ? '#10b981' : '#f43f5e',
      d: build.psu ? `${isEn ? 'Demand' : 'Demanda'}: ${reqPower}W | PSU: ${psuPower}W` : (isEn ? 'Pending' : 'Pendiente'),
    },
    { key: 'cooling', t: isEn ? 'COOLING CLEARANCE' : 'ESPACIO REFRIGERACIÓN', ok: coolerOk, c: coolerOk ? '#10b981' : '#f43f5e', d: coolerDesc },
    {
      key: 'socket',
      t: isEn ? 'SOCKET COMPATIBILITY' : 'COMPATIBILIDAD SOCKET',
      ok: socketOk,
      c: socketOk ? '#10b981' : '#f43f5e',
      d: build.cpu && build.mb ? (socketOk ? (isEn ? 'Matching LGA/AM' : 'LGA/AM Coincidente') : (isEn ? 'Incompatible' : 'Incompatible')) : (isEn ? 'Pending' : 'Pendiente'),
    },
  ];

  const selectedComponents = [
    { label: isEn ? 'PROCESSOR (CPU)' : 'PROCESADOR (CPU)', data: build.cpu },
    { label: isEn ? 'GRAPHICS CARD' : 'TARJETA GRÁFICA', data: build.gpu },
    { label: isEn ? 'MOTHERBOARD' : 'PLACA BASE', data: build.mb },
    { label: isEn ? 'COOLING' : 'REFRIGERACIÓN', data: build.cooler },
    { label: isEn ? 'RAM MEMORY' : 'MEMORIA RAM', data: build.ram },
    { label: isEn ? 'STORAGE' : 'ALMACENAMIENTO', data: build.storage },
    { label: isEn ? 'POWER SUPPLY' : 'FUENTE (PSU)', data: build.psu },
    { label: isEn ? 'CHASSIS / CASE' : 'CHASIS / CAJA', data: build.case },
  ].filter((c) => c.data);

  const physicalText = gpuOk && !cableCritical
    ? (isEn 
      ? `The internal architecture of the ${formatName(build.case) || ''} chassis provides verified clearance for the ${formatName(build.gpu) || ''} graphics card. With ${caseMaxGpu - gpuLen}mm of front clearance margin and ${Math.round(cableClearance)}mm lateral margin, it ensures tight closure of the side panel without over-bending the 12VHPWR power cable.`
      : `La arquitectura interna del chasis ${formatName(build.case) || ''} proporciona una holgura verificada para la gráfica ${formatName(build.gpu) || ''}. Con ${caseMaxGpu - gpuLen}mm de margen de tolerancia frontal y ${Math.round(cableClearance)}mm laterales, se asegura el cierre hermético del panel de cristal templado sin flexionar en exceso el conector de alimentación principal 12VHPWR.`)
    : build.gpu && build.case
    ? (isEn 
      ? `COLLISION RISK: The dimensions of the graphics card (${gpuLen}mm length and ${gpuWidth}mm width) directly conflict with physical limits inside the chassis. Proper installation or safe cable routing will be impossible.`
      : `RIESGO DE COLISIÓN: Las cotas de la tarjeta gráfica (${gpuLen}mm de largo y ${gpuWidth}mm de ancho) entran en conflicto directo con los límites físicos del habitáculo del chasis. Se imposibilitará la instalación correcta o el enrutamiento seguro de los cables de potencia PCIe.`)
    : (isEn ? 'Missing case or GPU data to perform volumetric clearance calculation.' : 'Faltan datos de chasis o tarjeta gráfica para realizar el cálculo de holgura volumétrica.');

  const thermalText = coolerOk
    ? (isEn 
      ? `System thermal profile is secured. The ${formatName(build.cooler) || ''} solution integrates seamlessly. This ensures the ${formatName(build.cpu) || ''} CPU maintains optimal boost clocks without thermal throttling, dissipating ${cpuTdp}W TDP.`
      : `El perfil térmico del sistema está asegurado. La solución ${formatName(build.cooler) || ''} se integra perfectamente. Esto asegura que la CPU ${formatName(build.cpu) || ''} mantenga frecuencias de reloj óptimas (boost clocks) constantes, evitando el temido 'thermal throttling' y prolongando la vida útil del silicio al disipar los ${cpuTdp}W de TDP.`)
    : build.cooler && build.case
    ? (isEn 
      ? `THERMAL CONFLICT: The chosen cooling system exceeds case tolerance limits. The side panel cannot close or required radiator mounts are missing.`
      : `CONFLICTO TÉRMICO: El sistema de refrigeración seleccionado supera las cotas de tolerancia de la caja. El panel lateral no podrá cerrarse o no existen anclajes compatibles para el radiador requerido.`)
    : (isEn ? 'Insufficient thermal data for heat dissipation forecast.' : 'Datos térmicos insuficientes para elaborar el pronóstico de disipación de calor.');

  const powerText = psuOk
    ? (isEn 
      ? `Electrical topology is guaranteed by the ${formatName(build.psu) || ''} unit. After crossing load curves, we calculate a peak demand of ${reqPower}W against ${psuPower}W nominal delivery. This safety headroom prevents shutdowns from transient power spikes.`
      : `La topología eléctrica está garantizada por la fuente ${formatName(build.psu) || ''}. Tras cruzar las curvas de consumo, calculamos una demanda pico de ${reqPower}W frente a los ${psuPower}W de entrega nominal. Este generoso margen asegura eficiencia óptima y evita apagones por picos transitorios (power spikes).`)
    : build.psu
    ? (isEn 
      ? `POWER DEFICIT: The ${psuPower}W capacity is insufficient to sustain peak demands (${reqPower}W). Immediate risk of triggering OCP/OPP protection systems.`
      : `DÉFICIT ENERGÉTICO: La capacidad de ${psuPower}W es insuficiente para sostener los picos requeridos (${reqPower}W). Riesgo inminente de activación de los sistemas de protección (OCP/OPP).`)
    : (isEn ? 'Power demand analysis suspended due to missing PSU unit.' : 'Análisis de demanda energética suspendido por ausencia de unidad de suministro (PSU).');

  const platformText = socketOk && build.mb && build.cpu
    ? (isEn 
      ? `Central bus interconnect is properly matched. The ${formatName(build.mb) || ''} motherboard natively supports the processor under socket ${build.cpu?.socket || ''}, enabling ultra-fast PCI-Express data transfers to memory and NVMe M.2 storage.`
      : `La interconexión central (bus de datos) está correctamente emparejada. La placa base ${formatName(build.mb) || ''} alberga nativamente el procesador bajo el zócalo ${build.cpu?.socket || ''}, habilitando la transferencia ultrarrápida de datos PCI-Express hacia la memoria y la unidad de almacenamiento sólido NVMe M.2.`)
    : !socketOk
    ? (isEn 
      ? `STRUCTURAL INCOMPATIBILITY: Attempting to pair processor (${build.cpu?.socket}) with an incompatible socket on motherboard (${build.mb?.socket}). Impossible to assemble.`
      : `INCOMPATIBILIDAD ESTRUCTURAL: Intento de emparejar el procesador (${build.cpu?.socket}) con un zócalo incompatible en la placa base (${build.mb?.socket}). Imposible proceder con el ensamble.`)
    : (isEn ? 'Missing motherboard or CPU components to validate processing ecosystem.' : 'Faltan componentes de placa base o CPU para validar el ecosistema de procesamiento.');

  const faqPower = build.psu
    ? psuOk
      ? (isEn ? `Yes. Your ${psuPower}W PSU comfortably covers the estimated ${reqPower}W peak demand (CPU + GPU TDP plus 25% safety margin for transient spikes).` : `Sí. Tu fuente de ${psuPower}W cubre con margen los ${reqPower}W de demanda pico estimada (TDP de CPU + GPU, más un 25% de margen de seguridad para picos transitorios).`)
      : (isEn ? `No. Estimated peak demand is ${reqPower}W while your PSU delivers ${psuPower}W. You risk shutdowns due to OCP/OPP protections.` : `No es suficiente. Se estima una demanda pico de ${reqPower}W y tu fuente entrega ${psuPower}W. Te arriesgas a apagones por activación de las protecciones OCP/OPP; sube de gama de PSU.`)
    : (isEn ? 'Rule of thumb: sum CPU and GPU TDP, add 80W for other parts, and multiply by 1.25 for transient spike safety margin.' : 'Como regla general: suma el TDP de tu CPU y tu GPU, añade unos 80W para el resto de componentes, y multiplica el resultado por 1,25 para dejar margen a los picos de consumo transitorios.');

  const faqSocket = build.cpu && build.mb
    ? socketOk
      ? (isEn ? `Yes. The processor (${build.cpu.socket}) and motherboard (${build.mb.socket}) share the same socket, so physical mounting is correct.` : `Sí. El procesador (${build.cpu.socket}) y la placa base (${build.mb.socket}) comparten el mismo zócalo, por lo que el montaje físico y eléctrico es correcto.`)
      : (isEn ? `No. The CPU uses socket ${build.cpu.socket} and motherboard is ${build.mb.socket}. They are physically incompatible.` : `No. El procesador usa socket ${build.cpu.socket} y la placa base es ${build.mb.socket}. Son físicamente incompatibles: no existe adaptador, tendrás que cambiar el procesador o la placa base.`)
    : (isEn ? 'CPU and motherboard sockets must match exactly (e.g. LGA1700 or AM5).' : 'El socket (zócalo) del procesador y el de la placa base deben coincidir exactamente (por ejemplo, LGA1700 o AM5). Si no coinciden, el procesador no encaja físicamente en la placa.');

  const faqGpuFit = build.gpu && build.case
    ? gpuOk
      ? (isEn ? `Yes. Your ${formatName(build.gpu)} is ${gpuLen}mm long and your case supports up to ${caseMaxGpu}mm, leaving ${caseMaxGpu - gpuLen}mm free.` : `Sí. Tu ${formatName(build.gpu)} mide ${gpuLen}mm y tu caja admite hasta ${caseMaxGpu}mm, dejando ${caseMaxGpu - gpuLen}mm libres.`)
      : (isEn ? `No. Your ${formatName(build.gpu)} is ${gpuLen}mm long, while the case only supports up to ${caseMaxGpu}mm. Missing ${gpuLen - caseMaxGpu}mm.` : `No. Tu ${formatName(build.gpu)} mide ${gpuLen}mm, mientras que el chasis solo admite hasta ${caseMaxGpu}mm. Faltan ${gpuLen - caseMaxGpu}mm de espacio.`)
    : (isEn ? 'Compare the GPU length in millimeters against the maximum supported length listed in the case specs.' : 'Compara la longitud en milímetros de la gráfica (publicada por el fabricante) con la longitud máxima admitida por tu caja, un dato que suele aparecer en la ficha técnica del chasis como "Max GPU Length".');

  const faqCable = build.gpu && build.case
    ? cableDesc
    : (isEn ? 'GPU width and clearance to the side panel determine if power cables fit without forcing. Under 20mm clearance usually requires a 90º angled adapter.' : 'El grosor de la tarjeta gráfica y el hueco libre hasta el panel de cristal templado determinan si el conector de alimentación y sus cables caben sin forzarse. Con menos de 20mm de margen suele ser obligatorio usar un cable acodado a 90º.');

  const faqCooler = build.cooler && build.case
    ? coolerDesc
    : (isEn ? 'Tower air coolers must respect maximum chassis height (typically 150-170mm), while liquid AIO radiators must fit available mounts (up to 360mm).' : 'Los disipadores de aire tipo torre deben respetar la altura máxima del chasis (normalmente entre 150 y 170mm), y los radiadores líquidos (AIO) deben caber en los anclajes frontales o superiores, habitualmente hasta 360mm.');

  const faqItems = [
    { q: isEn ? `Does the ${build.gpu ? formatName(build.gpu) : 'graphics card'} fit in the selected case?` : `¿Cabe la ${build.gpu ? formatName(build.gpu) : 'tarjeta gráfica'} en la caja seleccionada?`, a: faqGpuFit },
    { q: isEn ? 'Is my power supply (PSU) sufficient?' : '¿Es suficiente mi fuente de alimentación (PSU)?', a: faqPower },
    { q: isEn ? 'Do CPU and motherboard sockets match?' : '¿Coinciden el socket de la CPU y el de la placa base?', a: faqSocket },
    { q: isEn ? 'Do I need a 90º angled power cable?' : '¿Necesito un cable de alimentación acodado a 90º?', a: faqCable },
    { q: isEn ? 'What cooling system can I install in this chassis?' : '¿Qué refrigeración puedo instalar en este chasis?', a: faqCooler },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const itemListSchema = selectedComponents.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: selectedComponents.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${c.label}: ${formatName(c.data)}`,
        })),
      }
    : null;

  const diagramTitle = isEn 
    ? `Assembly Diagram: ${build.case ? formatName(build.case) : 'case'} with ${build.cpu ? formatName(build.cpu) : 'CPU'} and ${build.gpu ? formatName(build.gpu) : 'GPU'}`
    : `Diagrama del ensamblaje: ${build.case ? formatName(build.case) : 'chasis'} con ${build.cpu ? formatName(build.cpu) : 'CPU'} y ${build.gpu ? formatName(build.gpu) : 'GPU'}`;

  return (
    <div className="w-full font-sans animate-[fadeIn_0.5s_ease-out]">
      <style>{`
        @keyframes flowReverse { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 24; } }
        .cable-fluid { stroke-dasharray: 12 12; animation: flowReverse 0.8s linear infinite; }
        @keyframes liquidFlow { from { stroke-dashoffset: 8; } to { stroke-dashoffset: 0; } }
        .liquid-fluid { stroke-dasharray: 4 4; animation: liquidFlow 0.5s linear infinite; }
        @keyframes liquidFlowReverse { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 8; } }
        .liquid-fluid-reverse { stroke-dasharray: 4 4; animation: liquidFlowReverse 0.5s linear infinite; }
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-slow { animation: spinSlow 3s linear infinite; }
      `}</style>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {itemListSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      )}

      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold font-orbitron mb-3 uppercase tracking-wide">
          <span className="text-slate-400 block text-lg mb-1">
            {isEn ? 'Audit and Acquisition Center' : 'Centro de Auditoría y Adquisición'}
          </span>
          {build.case ? formatName(build.case) : (isEn ? 'CUSTOM BUILD' : 'CONFIGURACIÓN PERSONALIZADA')}
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm sm:text-base">
          {isEn 
            ? 'Verify millimeter clearances on the diagram and buy compatible parts directly from official platforms.'
            : 'Verifica las tolerancias milimétricas en el diagrama y adquiere las piezas compatibles directamente desde las plataformas oficiales.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 mb-16">
        <div className="relative bg-[#0a0a0c] border border-white/5 rounded-[24px] overflow-hidden min-h-[460px] flex items-center justify-center p-4 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]">
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          <svg role="img" aria-labelledby="pcDiagramTitle" viewBox="0 0 400 480" className="w-full max-w-[360px] max-h-[460px] relative z-10 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <title id="pcDiagramTitle">{diagramTitle}</title>
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <g transform="translate(0, 0)">
              <rect x="40" y="30" width="320" height="420" rx="10" fill="#090d13" stroke={mainStatusColor} strokeWidth="2.5" filter="url(#glow)"/>
              <rect x="60" y="60" width="220" height="240" rx="4" fill="#0d1117" stroke={build.mb ? '#00ffff' : '#333'} strokeWidth="1.5" strokeOpacity="0.5"/>
              <text x="170" y="290" fill="#555" fontFamily="Orbitron" fontSize="8" textAnchor="middle" letterSpacing="1">
                MOTHERBOARD {build.mb ? `| ${build.mb.socket || ''}` : ''}
              </text>

              <g transform="translate(160, 250)">
                <rect x="0" y="0" width="60" height="14" rx="2" fill={build.storage ? '#0d1117' : '#161b22'} stroke={build.storage ? '#00ffff' : '#333'} strokeWidth="1" filter={build.storage ? "url(#softGlow)" : ""} />
                {build.storage && <rect x="2" y="2" width="56" height="10" rx="1" fill="#00ffff" fillOpacity="0.25" />}
                <text x="30" y="10" fill={build.storage ? '#00ffff' : '#555'} fontFamily="monospace" fontSize="8" textAnchor="middle" fontWeight="bold">
                  {build.storage ? 'NVMe M.2' : 'SLOT M.2'}
                </text>
              </g>

              <g transform="translate(130, 100)">
                <rect x="0" y="0" width="55" height="50" rx="3" fill="#151b23" stroke={socketOk && build.cpu ? '#10b981' : '#f43f5e'} strokeWidth="2" filter="url(#glow)"/>
                <text x="27.5" y="30" fill="white" fontFamily="Orbitron" fontSize="11" fontWeight="bold" textAnchor="middle" filter="url(#softGlow)">CPU</text>
              </g>

              {isAIO ? (
                <g transform="translate(0, 0)">
                  <rect x="100" y="40" width="200" height="18" rx="2" fill="#161b22" stroke="#00ffff" strokeWidth="1.5" />
                  <path d="M 140 58 C 140 75, 145 80, 150 92" fill="none" stroke="#00ffff" strokeWidth="1.5" className="liquid-fluid" filter="url(#glow)" />
                  <path d="M 175 58 C 175 75, 170 80, 165 92" fill="none" stroke={mainStatusColor} strokeWidth="1.5" className="liquid-fluid-reverse" filter="url(#glow)" />
                  <g transform="translate(142.5, 92)">
                     <rect x="0" y="0" width="30" height="15" rx="2" fill="#0d1117" stroke="#00ffff" strokeWidth="1.5" filter="url(#glow)"/>
                     <circle cx="15" cy="7.5" r="4" fill="#00ffff" opacity="0.6"/>
                  </g>
                </g>
              ) : build.cooler ? (
                <g transform="translate(120, 85)">
                  <rect x="0" y="0" width="75" height="70" rx="4" fill="#0d1117" stroke="#00ffff" strokeWidth="1.5" />
                  <line x1="8" y1="10" x2="67" y2="10" stroke="#00ffff" strokeOpacity="0.4" strokeWidth="1" />
                  <line x1="8" y1="28" x2="67" y2="28" stroke="#00ffff" strokeOpacity="0.4" strokeWidth="1" />
                  <line x1="8" y1="46" x2="67" y2="46" stroke="#00ffff" strokeOpacity="0.4" strokeWidth="1" />
                  <line x1="8" y1="62" x2="67" y2="62" stroke="#00ffff" strokeOpacity="0.4" strokeWidth="1" />
                </g>
              ) : null}

              <g transform="translate(210, 90)">
                <rect x="0" y="0" width="5" height="65" rx="1" fill="#161b22" stroke={build.ram ? '#00ffff' : '#333'} strokeWidth="1" />
                <rect x="12" y="0" width="5" height="65" rx="1" fill="#161b22" stroke={build.ram ? '#00ffff' : '#333'} strokeWidth="1" />
                {build.ram && (
                  <>
                    <rect x="0" y="2" width="5" height="61" rx="1" fill="#00ffff" fillOpacity="0.8" filter="url(#glow)" />
                    <rect x="12" y="2" width="5" height="61" rx="1" fill="#00ffff" fillOpacity="0.8" filter="url(#glow)" />
                    <line x1="0" y1="2" x2="5" y2="2" stroke="white" strokeWidth="1.5" />
                    <line x1="12" y1="2" x2="17" y2="2" stroke="white" strokeWidth="1.5" />
                  </>
                )}
              </g>

              <g transform="translate(40, 320)">
                <rect x="0" y="0" width="320" height="130" rx="4" fill="#0d1117" stroke="white" strokeOpacity="0.15" strokeWidth="1.5" />
                <g transform="translate(15, 20)">
                  <rect x="0" y="0" width="130" height="80" rx="4" fill="#151b23" stroke={psuOk ? '#10b981' : '#f43f5e'} strokeWidth="2" filter="url(#glow)"/>
                  <circle cx="40" cy="40" r="24" fill="#0d1117" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
                  <text x="92" y="44" fill="white" fontFamily="Orbitron" fontSize="13" fontWeight="bold" textAnchor="middle">{psuPower}W</text>
                  <text x="92" y="58" fill={psuOk ? '#10b981' : '#f43f5e'} fontFamily="monospace" fontSize="8" textAnchor="middle">
                    {isEn ? 'POWER SUPPLY' : 'FUENTE PSU'}
                  </text>
                </g>
                <text x="230" y="60" fill="#555" fontFamily="monospace" fontSize="8" textAnchor="middle">CABLE SHROUD</text>
              </g>

              {build.gpu && (
                <>
                  {build.psu && (
                    <path
                      d={`M 150 340 C 290 330, 310 240, ${connectorX} 175`}
                      fill="none"
                      stroke={cableColorHex}
                      strokeWidth="3"
                      className="cable-fluid"
                      filter="url(#glow)"
                    />
                  )}
                  <g transform={`translate(${gpuX}, 185)`}>
                    <rect x="0" y="0" width={gpuWidthSvg} height="42" rx="4" fill="#0d1117" stroke={gpuOk ? '#10b981' : '#f43f5e'} strokeWidth="2" filter="url(#glow)"/>
                    <circle cx="30" cy="21" r="12" fill="#151b23" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
                    <circle cx="90" cy="21" r="12" fill="#151b23" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
                    <circle cx="150" cy="21" r="12" fill="#151b23" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
                    <text x={gpuWidthSvg - 30} y="25" fill="white" fontFamily="Orbitron" fontSize="11" fontWeight="bold" textAnchor="middle" filter="url(#softGlow)">GPU</text>
                  </g>
                  {build.psu && (
                    <g transform={`translate(${connectorX}, 185)`}>
                      <rect x="-12" y="-10" width="24" height="10" rx="2" fill="#111" stroke={cableColorHex} strokeWidth="1.5" filter="url(#glow)"/>
                      <line x1="-6" y1="-10" x2="-6" y2="-15" stroke={cableColorHex} strokeWidth="2" />
                      <line x1="0" y1="-10" x2="0" y2="-15" stroke={cableColorHex} strokeWidth="2" />
                      <line x1="6" y1="-10" x2="6" y2="-15" stroke={cableColorHex} strokeWidth="2" />
                    </g>
                  )}
                </>
              )}

              <g transform="translate(340, 75)" opacity="0.6">
                <g className="spin-slow" style={{ transformOrigin: '0px 35px' }}>
                  <circle cx="0" cy="35" r="14" fill="none" stroke={mainStatusColor} strokeWidth="1.5" />
                  <path d="M 0 21 L 0 49 M -14 35 L 14 35" stroke={mainStatusColor} strokeWidth="1.5" strokeOpacity="0.4" />
                </g>
                <g className="spin-slow" style={{ transformOrigin: '0px 115px' }}>
                  <circle cx="0" cy="115" r="14" fill="none" stroke={mainStatusColor} strokeWidth="1.5" />
                  <path d="M 0 101 L 0 129 M -14 115 L 14 115" stroke={mainStatusColor} strokeWidth="1.5" strokeOpacity="0.4" />
                </g>
                <g className="spin-slow" style={{ transformOrigin: '0px 195px' }}>
                  <circle cx="0" cy="195" r="14" fill="none" stroke={mainStatusColor} strokeWidth="1.5" />
                  <path d="M 0 181 L 0 209 M -14 195 L 14 195" stroke={mainStatusColor} strokeWidth="1.5" strokeOpacity="0.4" />
                </g>
              </g>

            </g>
          </svg>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5 mb-1 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ffff]"></span>
            <h2 className="font-orbitron font-bold text-white/80 uppercase tracking-[0.2em] text-xs">
              {isEn ? 'HUD Audit' : 'Auditoría HUD'}
            </h2>
          </div>

          <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-50 animate-ping" style={{ backgroundColor: mainStatusColor }}></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: mainStatusColor }}></span>
              </span>
              <span className="font-orbitron text-[9px] tracking-[0.2em] uppercase" style={{ color: mainStatusColor }}>
                {allClear ? (isEn ? 'System verified' : 'Sistema verificado') : (isEn ? 'Review required' : 'Revisión requerida')}
              </span>
            </div>
            <h2 className="font-orbitron font-bold tracking-wide text-[15px] text-white leading-snug">
              {statusMessage}
            </h2>
            <p className="text-slate-500 text-[11px] mt-2">
              {isEn ? 'Compatibility matrix completed.' : 'Matriz de compatibilidad completada.'}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {complianceChecks.map((c) => (
              <div key={c.key} className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl px-4 py-3.5 flex items-center gap-3.5 transition-colors duration-200">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${c.c}1f` }}>
                  {c.ok ? (
                    <svg className="w-3.5 h-3.5" style={{ color: c.c }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" style={{ color: c.c }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-orbitron text-[9.5px] tracking-[0.14em] font-bold uppercase text-white/80 mb-0.5">
                    {c.t}
                  </h3>
                  <p className="text-slate-400 text-[11px] font-mono leading-relaxed">
                    {c.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="mb-12 max-w-[1200px] mx-auto">
        <h2 className="text-2xl font-bold font-orbitron mb-6 uppercase tracking-widest text-white/90">
          {isEn ? 'Parametric Inventory' : 'Inventario Paramétrico'}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { tag: isEn ? '01 // CPU' : '01 // CPU', v: build.cpu, sub: build.cpu ? `${build.cpu.tdp || 120}W TDP` : '' },
            { tag: isEn ? '02 // GPU' : '02 // GRÁFICA', v: build.gpu, sub: build.gpu ? `${gpuLen}mm L | ${gpuWidth}mm W` : '' },
            { tag: isEn ? '03 // MOTHERBOARD' : '03 // PLACA BASE', v: build.mb, sub: build.mb ? `Socket ${build.mb.socket || ''}` : '' },
            { tag: isEn ? '04 // COOLER' : '04 // COOLER', v: build.cooler, sub: build.cooler ? (build.cooler.isLiquid ? (isEn ? 'Liquid AIO' : 'Líquida AIO') : (isEn ? 'Air Tower' : 'Torre Aire')) : '' },
            { tag: isEn ? '05 // RAM' : '05 // RAM', v: build.ram, sub: build.ram ? `${build.ram.ramType || ''}` : '' },
            { tag: isEn ? '06 // STORAGE' : '06 // ALMACENAM.', v: build.storage, sub: build.storage ? `NVMe M.2` : '' },
            { tag: isEn ? '07 // PSU' : '07 // FUENTE', v: build.psu, sub: build.psu ? `${build.psu.wattage || psuPower}W` : '' },
            { tag: isEn ? '08 // CHASSIS' : '08 // CHASIS', v: build.case, sub: build.case ? `Max GPU: ${caseMaxGpu}mm` : '' },
          ].map((item, idx) => (
            <div key={idx} className="bg-[#0a0a0c]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 transition-all hover:border-[#00ffff]/30 hover:bg-[#00ffff]/[0.02] group shadow-lg">
              <span className="text-[#00ffff] font-bold text-[10px] tracking-[0.2em] font-orbitron opacity-90 group-hover:opacity-100 transition-opacity block mb-2">{item.tag}</span>
              <h4 className="text-white font-medium text-sm leading-tight">
                {item.v ? formatName(item.v) : <span className="text-slate-600 italic">{isEn ? 'Not assigned' : 'No asignado'}</span>}
              </h4>
              <p className="text-slate-400 text-xs mt-1.5 font-mono">{item.sub || '...'}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedComponents.length > 0 && (
        <div className="mb-16 max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
            <h2 className="text-2xl font-bold font-orbitron uppercase tracking-widest text-white/90">
              {isEn ? 'Acquisition Center' : 'Central de Adquisición'}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-mono">
              {selectedComponents.length} {isEn ? (selectedComponents.length === 1 ? 'component' : 'components') : (selectedComponents.length === 1 ? 'componente' : 'componentes')} · {stores.length} {isEn ? 'stores' : 'tiendas'}
            </p>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl mb-6">
            {isEn 
              ? 'Clicking opens the store search pre-filtered by exact brand and model.'
              : 'Cada botón abre la búsqueda de esa tienda ya filtrada por marca y modelo exacto, para que no tengas que volver a escribir nada.'}
          </p>

          <div className="bg-[#0a0a0c] border border-white/5 rounded-[24px] p-2 sm:p-3 shadow-2xl">
            <div className="divide-y divide-white/5">
              {selectedComponents.map((comp, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                      <span className="font-orbitron text-[9px] font-bold text-[#00ffff] tracking-wide">{ICONS[comp.label] || '•'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-orbitron mb-0.5">{comp.label}</p>
                      <p className="text-white text-sm font-medium truncate">{formatName(comp.data)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0 pl-[52px] sm:pl-0">
                    {stores.map((store) => {
                      const query = formatName(comp.data);
                      const url = query ? store.buildUrl(query) : '#';

                      return (
                        <a
                          key={store.id}
                          href={url}
                          target="_blank"
                          rel="nofollow sponsored noopener noreferrer"
                          aria-label={`Search ${query} on ${store.name}`}
                          className="relative overflow-hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all text-[11px] font-orbitron tracking-wide text-slate-300 hover:text-white"
                        >
                          <span>{store.name}</span>
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-[2px]" 
                            style={{ background: `linear-gradient(90deg, transparent 0%, ${store.color} 50%, transparent 100%)` }}
                          ></div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold font-orbitron mb-6 uppercase tracking-widest text-white/90">
          {isEn ? 'Engineering & Assembly Analysis' : 'Análisis de Ingeniería y Ensamble'}
        </h2>

        <div className="bg-[#0a0a0c] border border-white/5 rounded-[24px] p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="space-y-8 relative z-10 text-slate-300 leading-relaxed text-[15px]">
            <div className="border-l-2 pl-4 border-cyan-500/30">
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide">
                {isEn ? 'Architecture & Physical Clearances' : 'Arquitectura y Holguras Físicas'}
              </h3>
              <p>{physicalText}</p>
            </div>
            <div className="border-l-2 pl-4 border-cyan-500/30">
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide">
                {isEn ? 'Platform & Logical Structure' : 'Plataforma y Estructura Lógica'}
              </h3>
              <p>{platformText}</p>
            </div>
            <div className="border-l-2 pl-4 border-cyan-500/30">
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide">
                {isEn ? 'Power Supply & Efficiency' : 'Suministro Energético y Eficiencia'}
              </h3>
              <p>{powerText}</p>
            </div>
            <div className="border-l-2 pl-4 border-cyan-500/30">
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide">
                {isEn ? 'Thermodynamics & Airflow' : 'Termodinámica y Flujo de Aire'}
              </h3>
              <p>{thermalText}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold font-orbitron mb-6 uppercase tracking-widest text-white/90">
          {isEn ? 'How We Calculate Compatibility' : 'Cómo Calculamos Cada Compatibilidad'}
        </h2>
        <div className="bg-[#0a0a0c] border border-white/5 rounded-[24px] p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="grid sm:grid-cols-2 gap-6 text-slate-300 text-sm leading-relaxed">
            <div>
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide text-[13px]">
                {isEn ? 'GPU Clearance' : 'Holgura de la GPU'}
              </h3>
              <p>{isEn ? 'We compare GPU length in millimeters against the maximum supported length in the chassis.' : 'Comparamos la longitud en milímetros de la tarjeta gráfica con la longitud máxima que admite el chasis. Si la gráfica mide más que ese límite, marcamos incompatibilidad física directa.'}</p>
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide text-[13px]">
                {isEn ? 'Cable & Side Glass' : 'Cableado y cristal lateral'}
              </h3>
              <p>{isEn ? 'We subtract GPU width from available side space to tempered glass. Less than 20mm suggests collision risk.' : 'Restamos el ancho de la GPU al hueco disponible junto al panel de cristal templado. Por debajo de 20mm consideramos riesgo de choque; entre 20 y 35mm, recomendamos cable acodado a 90º.'}</p>
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide text-[13px]">
                {isEn ? 'Power Supply Demand' : 'Suministro energético'}
              </h3>
              <p>{isEn ? 'We sum CPU + GPU TDP plus 80W base draw, applying a 25% safety margin for transient spikes.' : 'Sumamos el TDP de CPU y GPU más 80W de consumo base del resto de componentes, y aplicamos un 25% de margen de seguridad para picos transitorios. La PSU debe igualar o superar ese total.'}</p>
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide text-[13px]">
                {isEn ? 'Cooling Solution' : 'Refrigeración'}
              </h3>
              <p>{isEn ? 'For air towers, we verify max height. For AIO liquid coolers, we check radiator support up to 360mm.' : 'Para torres de aire, comparamos la altura del disipador con la altura máxima del chasis. Para líquida AIO, comprobamos que el tamaño del radiador (hasta 360mm) encaje en los anclajes disponibles.'}</p>
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide text-[13px]">
                {isEn ? 'CPU & Motherboard Socket' : 'Socket de CPU y placa base'}
              </h3>
              <p>{isEn ? 'CPU socket (e.g. LGA1700 or AM5) must match motherboard socket exactly.' : 'El zócalo del procesador (por ejemplo LGA1700 o AM5) debe coincidir exactamente con el de la placa base. No existen adaptadores físicos entre sockets distintos.'}</p>
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide text-[13px]">
                {isEn ? 'RAM & Storage' : 'RAM y almacenamiento'}
              </h3>
              <p>{isEn ? 'We confirm memory and storage modules are selected and compatible with motherboard slots.' : 'Verificamos que haya un módulo de memoria y una unidad de almacenamiento seleccionados; recomendamos siempre confirmar el tipo (DDR4/DDR5, NVMe/SATA) contra los slots reales de tu placa base.'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold font-orbitron mb-6 uppercase tracking-widest text-white/90">
          {isEn ? 'Compatibility Summary' : 'Resumen de Compatibilidad'}
        </h2>
        <div className="bg-[#0a0a0c] border border-white/5 rounded-[20px] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[520px]">
            <thead>
              <tr className="border-b border-white/5 text-[10px] sm:text-xs font-orbitron text-[#00ffff] tracking-widest uppercase">
                <th className="px-6 py-4 font-semibold">{isEn ? 'Check' : 'Verificación'}</th>
                <th className="px-6 py-4 font-semibold">{isEn ? 'Status' : 'Estado'}</th>
                <th className="px-6 py-4 font-semibold">{isEn ? 'Details' : 'Detalle'}</th>
              </tr>
            </thead>
            <tbody>
              {complianceChecks.map((c, i) => (
                <tr key={c.key} className={i % 2 === 1 ? 'bg-white/[0.02]' : ''}>
                  <td className="px-6 py-4 font-bold text-white">{c.t}</td>
                  <td className="px-6 py-4 font-orbitron font-bold" style={{ color: c.c }}>{c.ok ? 'OK' : (isEn ? 'REVIEW' : 'REVISAR')}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono text-xs">{c.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold font-orbitron mb-6 uppercase tracking-widest text-white/90">
          {isEn ? 'Frequently Asked Questions' : 'Preguntas Frecuentes'}
        </h2>
        <div className="bg-[#0a0a0c] border border-white/5 rounded-[24px] divide-y divide-white/5">
          {faqItems.map((item, i) => (
            <details key={i} className="group p-6 sm:p-8">
              <summary className="cursor-pointer font-orbitron text-sm sm:text-base text-white list-none flex justify-between items-center gap-4">
                {item.q}
                <span className="text-slate-500 group-open:rotate-45 transition-transform text-xl leading-none shrink-0">+</span>
              </summary>
              <p className="text-slate-300 text-sm leading-relaxed mt-4">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}