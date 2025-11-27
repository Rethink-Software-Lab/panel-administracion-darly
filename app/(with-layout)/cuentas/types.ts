import { inventarioTransacciones } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

export enum Banco {
  BPA = "BPA",
  BANDEC = "BANDEC",
}

export enum TipoTransferencia {
  INGRESO = "INGRESO",
  EGRESO = "EGRESO",
  VENTA = "VENTA",
  PAGO_TRABAJADOR = "PAGO_TRABAJADOR",
  GASTO_FIJO = "GASTO_FIJO",
  GASTO_VARIABLE = "GASTO_VARIABLE",
  TRANSFERENCIA = "TRANSFERENCIA",
  ENTRADA = "ENTRADA",
}

export enum TipoCuenta {
  EFECTIVO = "EFECTIVO",
  BANCARIA = "BANCARIA",
}

export enum Moneda {
  CUP = "CUP",
  USD = "USD",
}

export interface Tarjetas {
  id: number;
  nombre: string;
  tipo: string;
  banco: string | null;
  saldo: string;
  moneda: string;
  total_transferencias_mes: number;
}

export interface ResponseTarjetas {
  tarjetas: Tarjetas[];
  total_balance: number;
}

export interface Transacciones {
  id: number;
  cantidad: string;
  moneda: string;
  descripcion: string;
  createdAt: string;
  cuenta: string;
  tipo: string;
  usuario: string | null;
}

export interface Meta {
  pageCount: number;
  totalCount: number;
}

export interface CuentasInTransaccionesCompanent {
  id: number;
  nombre: string;
  tipo: string;
  banco: string | null;
}

export type TransaccionesSelect = Pick<
  InferSelectModel<typeof inventarioTransacciones>,
  | "id"
  | "cantidad"
  | "createdAt"
  | "descripcion"
  | "moneda"
  | "tipo"
  | "tipoCambio"
> & {
  usuario: string | null;
  cuenta: string;
  cuentaOrigen: string | null;
  cuentaDestino: string | null;
  tipoCambio: string | null;
};
