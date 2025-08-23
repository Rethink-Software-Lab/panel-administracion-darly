import { Usuario } from "../users/types";

export enum Banco {
  BPA = "BPA",
  BANDEC = "BANDEC",
}

export enum TipoTransferencia {
  INGRESO = "INGRESO",
  EGRESO = "EGRESO",
}

export enum TipoCuenta {
  EFECTIVO = "EFECTIVO",
  BANCARIA = "BANCARIA",
}

export interface Tarjetas {
  id: number;
  nombre: string;
  tipo: string;
  banco: string | null;
  saldo: string;
  total_transferencias_mes: number;
}

export interface Transferenciastarjetas {
  id: number;
  cantidad: string;
  descripcion: string;
  createdAt: string;
  cuenta: string;
  tipo: string;
  usuario: string | null;
  canDelete: boolean;
}

export interface ResponseTarjetas {
  tarjetas: Tarjetas[];
  transferencias: Transferenciastarjetas[];
  total_balance: number;
}
