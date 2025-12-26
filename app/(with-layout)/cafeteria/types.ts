import { METODOS_PAGO } from "../(almacen-cafeteria)/entradas-cafeteria/types";
import { Banco, TipoCuenta } from "../finanzas/types";

export interface ProductoCafeteria {
  id: number;
  nombre: string;
  precioVenta: string;
  cantidad: string;
}

export interface Prod_Elab_Venta {
  id: number;
  nombre: string;
  cantidad: number;
}

export interface Productos_Elaboraciones {
  id: number;
  nombre: string;
  isElaboracion: boolean;
}

export interface CuentasInVentasCafeteria {
  id: number;
  nombre: string;
  tipo: TipoCuenta;
  cantidad: string;
}

export interface VentasCafeteria {
  id: number;
  createdAt: string;
  usuario: string | null;
  metodoPago: METODOS_PAGO;
  productos: Prod_Elab_Venta[];
  elaboraciones: Prod_Elab_Venta[];
  cuentas: CuentasInVentasCafeteria[];
  importe: string;
  efectivo: string;
  transferencia: string;
}

export interface TarjetasVentas {
  id: number;
  nombre: string;
  banco: Banco | null;
  disponible: boolean;
}
export interface ResponseCafeteria {
  inventario: ProductoCafeteria[];
  ventas: VentasCafeteria[];
  tarjetas: TarjetasVentas[];
  productos_elaboraciones: Productos_Elaboraciones[];
}
