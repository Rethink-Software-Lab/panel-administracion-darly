import { Banco, Moneda, TipoCuenta } from "../transacciones/types";

export interface Cuenta {
  id: number;
  nombre: string;
  tipo: TipoCuenta;
  banco: Banco | null;
  saldo: string;
  moneda: Moneda;
  total_transferencias_mes: number;
}
