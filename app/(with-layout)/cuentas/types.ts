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
  descripcion: string;
  createdAt: string;
  cuenta: string;
  tipo: string;
  usuario: string | null;
  canDelete: boolean;
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

interface DataInResponseTransacciones {
  transacciones: Transacciones[];
  cuentas: CuentasInTransaccionesCompanent[];
}

export type ResponseTransacciones =
  | {
      data: DataInResponseTransacciones;
      meta: Meta;
      error: null;
    }
  | {
      data: null;
      meta: null;
      error: string;
    };
