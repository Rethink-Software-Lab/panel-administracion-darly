import { Categoria } from "../../categorias/types";
import { AreaVenta } from "../types";

export interface Zapatos {
  id: number;
  descripcion: string;
  color: string | null;
  numero: string | null;
}

export interface Productos {
  id: number;
  descripcion: string;
  precio_venta: string;
  cantidad: number;
  categoria__nombre: string | null;
}

export interface Inventario {
  productos: Productos[];
  zapatos: Zapatos[];
  categorias: Categoria[];
}

interface UsuarioVentas {
  id: number;
  username: string;
}
export interface Ventas {
  id: number;
  created_at: string;
  importe: number;
  metodo_pago: string;
  usuario: UsuarioVentas;
  descripcion: string;
  cantidad: number;
}

export interface CuentasBancarias {
  id: number;
  nombre: string;
  banco: string | null;
  disponible: boolean;
}

export interface AllProductos {
  id: number;
  descripcion: string;
  precioVenta: string;
  isZapato: boolean;
}

export type AreaVentaInResponseOneAreaVenta = Omit<AreaVenta, "color">;

export interface EndpointOneAreaVenta {
  inventario: Inventario;
  ventas: Ventas[];
  area_venta: AreaVentaInResponseOneAreaVenta;
  all_productos: AllProductos[];
  cuentas_bancarias: CuentasBancarias[];
}
