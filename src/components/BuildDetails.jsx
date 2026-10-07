// src/components/BuildDetails.jsx
// Secciones informativas bajo el fold del analizador (análisis, metodología, tabla y FAQ).
// Se carga bajo demanda (React.lazy + IntersectionObserver) desde FullPcAnalyzer para reducir
// el JavaScript inicial y mejorar INP / FID.
import React from 'react';

export default function BuildDetails({ isEn, physicalText, platformText, powerText, thermalText, complianceChecks, faqItems }) {
  return (
    <>
      {/* ANÁLISIS TÉCNICO Y INGENIERÍA */}
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

      {/* CÓMO CALCULAMOS CADA COMPATIBILIDAD */}
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

      {/* TABLA RESUMEN DE COMPATIBILIDAD */}
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

      {/* PREGUNTAS FRECUENTES */}
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
    </>
  );
}
