import React, { useEffect, useState } from 'react';

export default function FullPcAnalyzer({ db }) {
  const [build, setBuild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      
      // Failsafe seguro para buscar en los datasets particionados
      const getComp = (type, slug) => {
        if (!db || !db[type] || !slug) return undefined;
        return db[type].find(c => c.slug === slug);
      };

      setBuild({
        case: getComp('cases', params.get('case')),
        cpu: getComp('cpus', params.get('cpu')),
        gpu: getComp('gpus', params.get('gpu')),
        psu: getComp('psus', params.get('psu')),
        cooler: getComp('coolers', params.get('cooler')),
        mb: getComp('motherboards', params.get('mb')),
        ram: getComp('rams', params.get('ram')),
        storage: getComp('storage', params.get('storage')), // Corregido: 'storage' en singular
      });
      setLoading(false);
    } catch (error) {
      console.error("Error cargando telemetría:", error);
      setLoading(false);
    }
  }, [db]);

  if (loading || !build) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#00ffff] border-t-transparent animate-spin"></div>
        <p className="font-orbitron text-xs tracking-widest text-[#00ffff] uppercase">Procesando telemetría del sistema...</p>
      </div>
    );
  }

  // --- 1. CÁLCULOS TÉCNICOS ADAPTADOS A LOS JSONS INDIVIDUALES ---
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
  
  // Semáforo del cable GPU vs Cristal
  let cableCritical = false;
  let cableColorHex = '#10b981'; 
  let cableDesc = 'Pendiente de GPU o Chasis';
  
  if (build.gpu && build.case) {
    if (cableClearance < 20) {
      cableCritical = true;
      cableColorHex = '#f43f5e';
      cableDesc = `Choque contra cristal: ${Math.round(cableClearance)}mm de margen. Necesitas caja más ancha.`;
    } else if (cableClearance < 35) {
      cableColorHex = '#fbbf24';
      cableDesc = `Cierre forzado: ${Math.round(cableClearance)}mm libres. Usa cable acodado a 90º.`;
    } else {
      cableDesc = `Holgura lateral segura: ${Math.round(cableClearance)}mm libres hasta el cristal.`;
    }
  }

  // Refrigeración
  let coolerOk = false;
  let coolerDesc = 'Falta Disipador o Chasis';
  if (build.cooler && build.case) {
    if (build.cooler.isLiquid) {
      coolerOk = (build.cooler.radiatorSizeMM || 240) <= 360;
      coolerDesc = `Radiador AIO: ${build.cooler.radiatorSizeMM || 240}mm. Límite chasis OK.`;
    } else {
      const height = build.cooler.heightMM || 155;
      coolerOk = height <= (build.case.maxCpuCoolerHeightMM || 999);
      coolerDesc = `Torre: ${height}mm. Límite: ${build.case.maxCpuCoolerHeightMM || 165}mm.`;
    }
  }

  const socketOk = build.cpu && build.mb ? build.cpu.socket === build.mb.socket : true;
  const ramOk = Boolean(build.ram);
  const storageOk = Boolean(build.storage);

  const allClear = psuOk && gpuOk && coolerOk && socketOk && ramOk && storageOk && !cableCritical;
  const mainStatusColor = allClear ? '#10b981' : '#f43f5e';
  const statusMessage = allClear ? 'ENSAMBLAJE TOTALMENTE VIABLE' : 'INCOMPATIBILIDAD O RIESGO ESTRUCTURAL';

  const isAIO = build.cooler?.isLiquid;

  // Coordenadas Dinámicas SVG
  const gpuWidthSvg = gpuLen > 330 ? 240 : 200;
  const gpuX = 60;
  const connectorX = gpuX + gpuWidthSvg - 30;

  // --- 2. GENERADOR DE ENLACES PARA TIENDAS ---
  const selectedComponents = [
    { label: 'PROCESADOR (CPU)', data: build.cpu },
    { label: 'TARJETA GRÁFICA', data: build.gpu },
    { label: 'PLACA BASE', data: build.mb },
    { label: 'REFRIGERACIÓN', data: build.cooler },
    { label: 'MEMORIA RAM', data: build.ram },
    { label: 'ALMACENAMIENTO', data: build.storage },
    { label: 'FUENTE (PSU)', data: build.psu },
    { label: 'CHASIS / CAJA', data: build.case },
  ].filter(c => c.data);

  const getStoreLink = (store, item) => {
    if (!item || !item.model) return '#';
    const brandName = item.brand && !item.brand.toLowerCase().includes('genér') ? item.brand : '';
    const query = encodeURIComponent(`${brandName} ${item.model}`.trim());
    if (store === 'amazon') return `https://www.amazon.es/s?k=${query}&tag=TU_TAG_AFILIADO_AQUI-21`;
    if (store === 'pcc') return `https://www.pccomponentes.com/buscar/?query=${query}`;
    if (store === 'coolmod') return `https://www.coolmod.com/buscar/?search=${query}`;
    return '#';
  };

  // Helper para mostrar nombres limpios en el inventario
  const formatName = (comp) => {
    if (!comp) return null;
    const brandName = comp.brand && !comp.brand.toLowerCase().includes('genér') ? comp.brand : '';
    return `${brandName} ${comp.model}`.trim();
  };

  // --- 3. GENERACIÓN DE TEXTOS SEO NARRATIVOS ---
  const physicalText = gpuOk && !cableCritical
    ? `La arquitectura interna del chasis ${formatName(build.case) || ''} proporciona una holgura verificada para la gráfica ${formatName(build.gpu) || ''}. Con ${caseMaxGpu - gpuLen}mm de margen de tolerancia frontal y ${Math.round(cableClearance)}mm laterales, se asegura el cierre hermético del panel de cristal templado sin flexionar en exceso el conector de alimentación principal 12VHPWR.`
    : build.gpu && build.case 
    ? `RIESGO DE COLISIÓN: Las cotas de la tarjeta gráfica (${gpuLen}mm de largo y ${gpuWidth}mm de ancho) entran en conflicto directo con los límites físicos del habitáculo del chasis. Se imposibilitará la instalación correcta o el enrutamiento seguro de los cables de potencia PCIe.` 
    : 'Faltan datos de chasis o tarjeta gráfica para realizar el cálculo de holgura volumétrica.';

  const thermalText = coolerOk 
    ? `El perfil térmico del sistema está asegurado. La solución ${formatName(build.cooler) || ''} se integra perfectamente. Esto asegura que la CPU ${formatName(build.cpu) || ''} mantenga frecuencias de reloj óptimas (boost clocks) constantes, evitando el temido 'thermal throttling' y prolongando la vida útil del silicio al disipar los ${cpuTdp}W de TDP.`
    : build.cooler && build.case 
    ? `CONFLICTO TÉRMICO: El sistema de refrigeración seleccionado supera las cotas de tolerancia de la caja. El panel lateral no podrá cerrarse o no existen anclajes compatibles para el radiador requerido.`
    : 'Datos térmicos insuficientes para elaborar el pronóstico de disipación de calor.';

  const powerText = psuOk 
    ? `La topología eléctrica está garantizada por la fuente ${formatName(build.psu) || ''}. Tras cruzar las curvas de consumo, calculamos una demanda pico de ${reqPower}W frente a los ${psuPower}W de entrega nominal. Este generoso margen asegura eficiencia óptima y evita apagones por picos transitorios (power spikes).`
    : build.psu 
    ? `DÉFICIT ENERGÉTICO: La capacidad de ${psuPower}W es insuficiente para sostener los picos requeridos (${reqPower}W). Riesgo inminente de activación de los sistemas de protección (OCP/OPP).`
    : 'Análisis de demanda energética suspendido por ausencia de unidad de suministro (PSU).';

  const platformText = socketOk && build.mb && build.cpu
    ? `La interconexión central (bus de datos) está correctamente emparejada. La placa base ${formatName(build.mb) || ''} alberga nativamente el procesador bajo el zócalo ${build.cpu?.socket || ''}, habilitando la transferencia ultrarrápida de datos PCI-Express hacia la memoria y la unidad de almacenamiento sólido NVMe M.2.`
    : !socketOk 
    ? `INCOMPATIBILIDAD ESTRUCTURAL: Intento de emparejar el procesador (${build.cpu?.socket}) con un zócalo incompatible en la placa base (${build.mb?.socket}). Imposible proceder con el ensamble.`
    : 'Faltan componentes de placa base o CPU para validar el ecosistema de procesamiento.';

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

      {/* ENCABEZADO */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold font-orbitron mb-3 uppercase tracking-wide">
          <span className="text-slate-400 block text-lg mb-1">Centro de Auditoría y Adquisición</span>
          {build.case ? formatName(build.case) : 'CONFIGURACIÓN PERSONALIZADA'}
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm sm:text-base">
          Verifica las tolerancias milimétricas en el diagrama y adquiere las piezas compatibles directamente desde las plataformas oficiales.
        </p>
      </div>

      {/* BLOQUE PRINCIPAL: DIBUJO (IZQ) Y VERIFICACIÓN (DER) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 mb-16">
        
        {/* DIAGRAMA VISUAL DEL PC */}
        <div className="relative bg-[#0a0a0c] border border-white/5 rounded-[24px] overflow-hidden min-h-[460px] flex items-center justify-center p-4 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]">
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <svg viewBox="0 0 400 480" className="w-full max-w-[360px] max-h-[460px] relative z-10 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
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
              {/* CHASIS */}
              <rect x="40" y="30" width="320" height="420" rx="10" fill="#090d13" stroke={mainStatusColor} strokeWidth="2.5" filter="url(#glow)"/>
              
              {/* PLACA BASE */}
              <rect x="60" y="60" width="220" height="240" rx="4" fill="#0d1117" stroke={build.mb ? '#00ffff' : '#333'} strokeWidth="1.5" strokeOpacity="0.5"/>
              <text x="170" y="290" fill="#555" fontFamily="Orbitron" fontSize="8" textAnchor="middle" letterSpacing="1">
                MOTHERBOARD {build.mb ? `| ${build.mb.socket || ''}` : ''}
              </text>

              {/* NVMe SSD */}
              <g transform="translate(160, 250)">
                <rect x="0" y="0" width="60" height="14" rx="2" fill={build.storage ? '#0d1117' : '#161b22'} stroke={build.storage ? '#00ffff' : '#333'} strokeWidth="1" filter={build.storage ? "url(#softGlow)" : ""} />
                {build.storage && <rect x="2" y="2" width="56" height="10" rx="1" fill="#00ffff" fillOpacity="0.25" />}
                <text x="30" y="10" fill={build.storage ? '#00ffff' : '#555'} fontFamily="monospace" fontSize="8" textAnchor="middle" fontWeight="bold">
                  {build.storage ? 'NVMe M.2' : 'SLOT M.2'}
                </text>
              </g>

              {/* CPU */}
              <g transform="translate(130, 100)">
                <rect x="0" y="0" width="55" height="50" rx="3" fill="#151b23" stroke={socketOk && build.cpu ? '#10b981' : '#f43f5e'} strokeWidth="2" filter="url(#glow)"/>
                <text x="27.5" y="30" fill="white" fontFamily="Orbitron" fontSize="11" fontWeight="bold" textAnchor="middle" filter="url(#softGlow)">CPU</text>
              </g>

              {/* REFRIGERACIÓN Y TUBOS LÍQUIDA AIO */}
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

              {/* MEMORIA RAM */}
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

              {/* CAJETÍN PSU */}
              <g transform="translate(40, 320)">
                <rect x="0" y="0" width="320" height="130" rx="4" fill="#0d1117" stroke="white" strokeOpacity="0.15" strokeWidth="1.5" />
                <g transform="translate(15, 20)">
                  <rect x="0" y="0" width="130" height="80" rx="4" fill="#151b23" stroke={psuOk ? '#10b981' : '#f43f5e'} strokeWidth="2" filter="url(#glow)"/>
                  <circle cx="40" cy="40" r="24" fill="#0d1117" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
                  <text x="92" y="44" fill="white" fontFamily="Orbitron" fontSize="13" fontWeight="bold" textAnchor="middle">{psuPower}W</text>
                  <text x="92" y="58" fill={psuOk ? '#10b981' : '#f43f5e'} fontFamily="monospace" fontSize="8" textAnchor="middle">FUENTE PSU</text>
                </g>
                <text x="230" y="60" fill="#555" fontFamily="monospace" fontSize="8" textAnchor="middle">CABLE SHROUD</text>
              </g>

              {/* GPU Y CABLE DE ENERGÍA */}
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

              {/* VENTILADORES FRONTALES EMPOTRADOS */}
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

        {/* PANEL LATERAL DE VERIFICACIÓN (DERECHA) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2 px-1">
            <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981] animate-pulse"></span>
            <h2 className="font-orbitron font-bold text-white uppercase tracking-widest text-sm">Auditoría HUD</h2>
          </div>

          <div className="bg-[#0a0a0c] border border-white/5 rounded-[20px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: mainStatusColor, boxShadow: `0 0 20px ${mainStatusColor}` }}></div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-orbitron font-bold tracking-widest text-xs uppercase" style={{ color: mainStatusColor, textShadow: `0 0 15px ${mainStatusColor}` }}>
                {statusMessage}
              </h2>
            </div>
            <p className="text-slate-400 text-[11px] mt-2">Matriz de compatibilidad completada.</p>
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              { t: 'HOLGURA LONGITUD (GPU)', ok: gpuOk, c: gpuOk ? '#10b981' : '#f43f5e', d: build.gpu && build.case ? `Longitud: ${gpuLen}mm | Máx: ${caseMaxGpu}mm` : 'Pendiente' },
              { t: 'CABLEADO Y CRISTAL (ANCHO)', ok: !cableCritical, c: cableColorHex, d: cableDesc },
              { t: 'SUMINISTRO ENERGÉTICO', ok: psuOk, c: psuOk ? '#10b981' : '#f43f5e', d: build.psu ? `Demanda: ${reqPower}W | PSU: ${psuPower}W` : 'Pendiente' },
              { t: 'ESPACIO REFRIGERACIÓN', ok: coolerOk, c: coolerOk ? '#10b981' : '#f43f5e', d: coolerDesc },
              { t: 'COMPATIBILIDAD SOCKET', ok: socketOk, c: socketOk ? '#10b981' : '#f43f5e', d: build.cpu && build.mb ? (socketOk ? `LGA/AM Coincidente` : `Incompatible`) : 'Pendiente' },
            ].map((c, i) => (
              <div key={i} className="relative bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/5 hover:border-white/10 rounded-[16px] p-3.5 flex items-center justify-between overflow-hidden group transition-all duration-300">
                <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5 opacity-80 group-hover:opacity-100" style={{ backgroundColor: c.c, boxShadow: `0 0 10px ${c.c}` }}></div>
                <div className="pl-2.5 relative z-10 flex-1">
                  <h3 className="font-orbitron text-[9px] tracking-[0.15em] font-bold uppercase mb-1" style={{ color: c.c }}>
                    {c.t}
                  </h3>
                  <p className="text-slate-300 text-[10px] font-mono leading-relaxed pr-2">
                    {c.d}
                  </p>
                </div>
                <div className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10">
                  <div className="absolute inset-0 rounded-full border-[1.5px] border-dashed opacity-40 group-hover:animate-[spin_4s_linear_infinite]" style={{ borderColor: c.c }}></div>
                  <div className="absolute inset-1 rounded-full opacity-20" style={{ backgroundColor: c.c }}></div>
                  {c.ok ? (
                    <svg className="w-3.5 h-3.5 relative z-10" style={{ color: c.c }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 relative z-10" style={{ color: c.c }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* DISEÑO BENTO GRID: INVENTARIO */}
      <div className="mb-12 max-w-[1200px] mx-auto">
        <h2 className="text-2xl font-bold font-orbitron mb-6 uppercase tracking-widest text-white/90">Inventario Paramétrico</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { tag: '01 // CPU', v: build.cpu, sub: build.cpu ? `${build.cpu.tdp || 120}W TDP` : '' },
            { tag: '02 // GRÁFICA', v: build.gpu, sub: build.gpu ? `${gpuLen}mm L | ${gpuWidth}mm A` : '' },
            { tag: '03 // PLACA BASE', v: build.mb, sub: build.mb ? `Socket ${build.mb.socket || ''}` : '' },
            { tag: '04 // COOLER', v: build.cooler, sub: build.cooler ? (build.cooler.isLiquid ? 'Líquida AIO' : 'Torre Aire') : '' },
            { tag: '05 // RAM', v: build.ram, sub: build.ram ? `${build.ram.ramType || ''}` : '' },
            { tag: '06 // ALMACENAM.', v: build.storage, sub: build.storage ? `NVMe M.2` : '' },
            { tag: '07 // FUENTE', v: build.psu, sub: build.psu ? `${build.psu.wattage || psuPower}W` : '' },
            { tag: '08 // CHASIS', v: build.case, sub: build.case ? `Max GPU: ${caseMaxGpu}mm` : '' },
          ].map((item, idx) => (
            <div key={idx} className="bg-[#0a0a0c]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 transition-all hover:border-[#00ffff]/30 hover:bg-[#00ffff]/[0.02] group shadow-lg">
              <span className="text-[#00ffff] font-bold text-[10px] tracking-[0.2em] font-orbitron opacity-90 group-hover:opacity-100 transition-opacity block mb-2">{item.tag}</span>
              <h4 className="text-white font-medium text-sm leading-tight">{item.v ? formatName(item.v) : <span className="text-slate-600 italic">No asignado</span>}</h4>
              <p className="text-slate-400 text-xs mt-1.5 font-mono">{item.sub || '...'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CENTRAL DE ADQUISICIÓN / TIENDAS */}
      {selectedComponents.length > 0 && (
        <div className="mb-16 max-w-[1200px] mx-auto">
          <h2 className="text-2xl font-bold font-orbitron mb-6 uppercase tracking-widest text-white/90">Central de Adquisición</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tarjeta AMAZON */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-[20px] p-6 shadow-lg hover:border-[#ff9900]/40 transition-colors group">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#ff9900] shadow-[0_0_8px_#ff9900]"></div>
                <h3 className="font-orbitron font-bold text-[#ff9900] tracking-wider text-sm">AMAZON ES</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedComponents.map((comp, i) => (
                  <a key={`az-${i}`} href={getStoreLink('amazon', comp.data)} target="_blank" rel="nofollow noopener noreferrer" className="px-3 py-1.5 bg-white/5 hover:bg-[#ff9900]/10 border border-white/10 hover:border-[#ff9900]/50 rounded-full text-[10px] font-orbitron tracking-wider text-slate-300 hover:text-white transition-all flex items-center gap-1.5">
                    {comp.label} <span className="text-[#ff9900] opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Tarjeta PCCOMPONENTES */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-[20px] p-6 shadow-lg hover:border-[#ff6600]/40 transition-colors group">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#ff6600] shadow-[0_0_8px_#ff6600]"></div>
                <h3 className="font-orbitron font-bold text-[#ff6600] tracking-wider text-sm">PCCOMPONENTES</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedComponents.map((comp, i) => (
                  <a key={`pc-${i}`} href={getStoreLink('pcc', comp.data)} target="_blank" rel="nofollow noopener noreferrer" className="px-3 py-1.5 bg-white/5 hover:bg-[#ff6600]/10 border border-white/10 hover:border-[#ff6600]/50 rounded-full text-[10px] font-orbitron tracking-wider text-slate-300 hover:text-white transition-all flex items-center gap-1.5">
                    {comp.label} <span className="text-[#ff6600] opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Tarjeta COOLMOD */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-[20px] p-6 shadow-lg hover:border-[#00bfff]/40 transition-colors group">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#00bfff] shadow-[0_0_8px_#00bfff]"></div>
                <h3 className="font-orbitron font-bold text-[#00bfff] tracking-wider text-sm">COOLMOD</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedComponents.map((comp, i) => (
                  <a key={`cm-${i}`} href={getStoreLink('coolmod', comp.data)} target="_blank" rel="nofollow noopener noreferrer" className="px-3 py-1.5 bg-white/5 hover:bg-[#00bfff]/10 border border-white/10 hover:border-[#00bfff]/50 rounded-full text-[10px] font-orbitron tracking-wider text-slate-300 hover:text-white transition-all flex items-center gap-1.5">
                    {comp.label} <span className="text-[#00bfff] opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TEXTO NARRATIVO AVANZADO PARA SEO Y ADSENSE */}
      <div className="mb-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold font-orbitron mb-6 uppercase tracking-widest text-white/90">Análisis de Ingeniería y Ensamble</h2>
        
        <div className="bg-[#0a0a0c] border border-white/5 rounded-[24px] p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="space-y-8 relative z-10 text-slate-300 leading-relaxed text-[15px]">
            <div className="border-l-2 pl-4 border-cyan-500/30">
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide">Arquitectura y Holguras Físicas</h3>
              <p>{physicalText}</p>
            </div>
            <div className="border-l-2 pl-4 border-cyan-500/30">
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide">Plataforma y Estructura Lógica</h3>
              <p>{platformText}</p>
            </div>
            <div className="border-l-2 pl-4 border-cyan-500/30">
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide">Suministro Energético y Eficiencia</h3>
              <p>{powerText}</p>
            </div>
            <div className="border-l-2 pl-4 border-cyan-500/30">
              <h3 className="font-orbitron font-bold text-white mb-2 tracking-wide">Termodinámica y Flujo de Aire</h3>
              <p>{thermalText}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}