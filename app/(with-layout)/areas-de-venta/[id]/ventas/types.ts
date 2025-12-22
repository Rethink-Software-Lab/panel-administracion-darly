import { inventarioVentas } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

export type Venta = Pick<
  InferSelectModel<typeof inventarioVentas>,
  "id" | "createdAt" | "metodoPago"
> & {
  cantidad: number;
  descripcion: string;
  importe: number;
  usuario: { id: number; username: string };
};

export type Producto = {
  id: number;
  descripcion: string;
  precioVenta: string;
  isZapato: boolean;
  disponible: boolean;
};
