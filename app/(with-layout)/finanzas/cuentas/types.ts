export interface Cuenta {
  id: number;
  nombre: string;
  tipo: string;
  banco: string | null;
  saldo: string;
  moneda: string;
  total_transferencias_mes: number;
}
