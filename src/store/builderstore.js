import { atom } from 'nanostores';

// Estado global de la configuración del PC
export const pcBuild = atom({
  gpu: null,
  case: null,
  cooler: null,
  motherboard: null,
  psu: null,
  ram: null,
  cpu: null,
  storage: null
});

// Función para actualizar una pieza específica
export function setPcPart(category, componentData) {
  pcBuild.set({ ...pcBuild.get(), [category]: componentData });
}