import { AreaVenta } from "../areas-de-venta/types";

export enum TiposGastos {
  FIJO = "FIJO",
  VARIABLE = "VARIABLE",
}

export enum FrecuenciasGastos {
  LUNES_SABADO = "LUNES_SABADO",
  SEMANAL = "SEMANAL",
  MENSUAL = "MENSUAL",
}

export interface Gasto {
  id: number;
  descripcion: string;
  created_at: string;
  cantidad: number;
  area_venta: string | null;
  is_cafeteria: boolean;
  tipo: string;
  frecuencia: string | null;
  dia_mes: number | null;
  usuario: string | null;
  dia_semana: number | null;
}

type AreaVentaForSelectGasto = Omit<AreaVenta, "color" | "isMesa">;

export interface ResponseGastos {
  fijos: Gasto[];
  variables: Gasto[];
  areas_venta: AreaVentaForSelectGasto[];
}
