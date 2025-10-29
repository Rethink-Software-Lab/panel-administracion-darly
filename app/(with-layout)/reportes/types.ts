import { AreaVenta } from "../areas-de-venta/types";
import { Categoria } from "../categorias/types";

export type AreaVentaInReporteFormData = Pick<AreaVenta, "id" | "nombre">;

export interface ReporteFormData {
  areas: AreaVentaInReporteFormData[];
  categorias: Categoria[];
}
