import { AreaVenta } from "../areas-de-venta/types";
import { Tarjetas } from "../cuentas/types";

export enum TiposGastos {
  FIJO = "FIJO",
  VARIABLE = "VARIABLE",
}

export enum FrecuenciasGastos {
  LUNES_SABADO = "LUNES_SABADO",
  SEMANAL = "SEMANAL",
  MENSUAL = "MENSUAL",
}

interface AreaVentaInGasto {
  id: number;
  nombre: string;
}

interface CuentaInGasto {
  id: number;
  nombre: string;
}

export interface Gasto {
  id: number;
  descripcion: string;
  created_at: string;
  cantidad: number;
  cuenta: CuentaInGasto | null;
  area_venta: AreaVentaInGasto | null;
  is_cafeteria: boolean;
  tipo: string;
  frecuencia: string | null;
  diaMes: number | null;
  usuario: string | null;
  diaSemana: number | null;
}

export type AreaVentaForSelectGasto = Omit<AreaVenta, "color" | "isMesa">;

export type CuentaForSelectGasto = Omit<
  Tarjetas,
  "saldo" | "total_transferencias_mes" | "moneda"
>;

export interface ResponseGastos {
  fijos: Gasto[];
  variables: Gasto[];
  areas_venta: AreaVentaForSelectGasto[];
  cuentas: CuentaForSelectGasto[];
}
