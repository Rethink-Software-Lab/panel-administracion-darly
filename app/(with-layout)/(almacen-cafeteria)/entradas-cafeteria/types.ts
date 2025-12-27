import { Cuenta } from "../../finanzas/cuentas/types";
import { Proveedor } from "../../proveedores/types";

export enum METODOS_PAGO {
  EFECTIVO = "EFECTIVO",
  TRANSFERENCIA = "TRANSFERENCIA",
  MIXTO = "MIXTO",
}

export interface ProductoEntrada {
  id: number;
  nombre: string;
  precio_costo: string;
  precio_venta: number;
}

export interface ProductosInEntrada {
  id: number;
  producto: ProductoEntrada;
  cantidad: number;
}

export interface EntradaCafeteria {
  id: number;
  usuario: string | null;
  createdAt: string;
  metodoPago: string;
  proveedor: Proveedor | null;
  proveedorNombre: string | null;
  proveedorNit: string | null;
  proveedorTelefono: string | null;
  proveedorDireccion: string | null;
  proveedorNoCuentaCup: string | null;
  proveedorNoCuentaMayorista: string | null;
  comprador: string;
  productos: ProductosInEntrada[];
}

export interface EndpointEntradasCafeteria {
  productos: ProductoEntrada[];
  entradas: EntradaCafeteria[];
  cuentas: Omit<Cuenta, "total_transferencias_mes" | "moneda">[];
  proveedores: Pick<Proveedor, "id" | "nombre">[];
}
