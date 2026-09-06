export interface DimensionMM {
  lengthMM: number;
  widthMM: number;
  heightMM: number;
}

export interface Case {
  id: string;
  brand: string;
  model: string;
  slug: string;
  maxGpuLengthMM: number;
  maxCpuCoolerHeightMM: number;
  internalWidthMM: number;
}

export interface GPU {
  id: string;
  brand: string;
  model: string;
  slug: string;
  connectorType: '12VHPWR' | '8PIN';
  dimensions: DimensionMM;
}

export interface AIO {
  id: string;
  brand: string;
  model: string;
  slug: string;
  radiatorThicknessMM: number;
  fanThicknessMM: number;
  totalThicknessMM: number;
}

export interface ClearanceResult {
  frontMarginMM: number;
  lateralMarginMM: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  warnings: string[];
}