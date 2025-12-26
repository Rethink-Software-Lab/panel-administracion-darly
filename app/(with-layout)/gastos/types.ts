import { AreaVenta } from "../areas-de-venta/types";
import { Cuenta } from "../finanzas/cuentas/types";

export enum TiposGastos {
  FIJO = "FIJO",
  VARIABLE = "VARIABLE",
}

export enum FrecuenciasGastos {
  DIARIO = "DIARIO",
  SEMANAL = "SEMANAL",
  MENSUAL = "MENSUAL",
  LUNES_SABADO = "LUNES_SABADO",
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
  areas_venta: AreaVentaInGasto[];
  is_cafeteria: boolean;
  tipo: string;
  frecuencia: string | null;
  diaMes: number | null;
  usuario: string | null;
  diaSemana: number | null;
}

export type AreaVentaForSelectGasto = Pick<AreaVenta, "id" | "nombre">;

export type CuentaForSelectGasto = Omit<
  Cuenta,
  "saldo" | "total_transferencias_mes" | "moneda"
>;

export interface ResponseGastos {
  fijos: Gasto[];
  variables: Gasto[];
  areas_venta: AreaVentaForSelectGasto[];
  cuentas: CuentaForSelectGasto[];
}
