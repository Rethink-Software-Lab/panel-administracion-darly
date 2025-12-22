import { db } from "@/db/initial";
import {
  inventarioAjusteinventarioProductos,
  inventarioCategorias,
  inventarioProducto,
  inventarioProductoinfo,
} from "@/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

export async function getInventarioZapatosAreaVenta(id: number) {
  try {
    const zapatos = await db
      .select({
        id: inventarioProducto.id,
        descripcion: inventarioProductoinfo.descripcion,
        color: inventarioProducto.color,
        numero: inventarioProducto.numero,
      })
      .from(inventarioProducto)
      .innerJoin(
        inventarioProductoinfo,
        eq(inventarioProducto.infoId, inventarioProductoinfo.id)
      )
      .innerJoin(
        inventarioCategorias,
        eq(inventarioProductoinfo.categoriaId, inventarioCategorias.id)
      )
      .leftJoin(
        inventarioAjusteinventarioProductos,
        eq(
          inventarioProducto.id,
          inventarioAjusteinventarioProductos.productoId
        )
      )
      .where(
        and(
          eq(inventarioCategorias.nombre, "Zapatos"),
          isNull(inventarioProducto.ventaId),
          eq(inventarioProducto.areaVentaId, Number(id)),
          isNull(inventarioAjusteinventarioProductos.ajusteinventarioId)
        )
      )
      .orderBy(desc(inventarioProducto.id));

    return {
      data: zapatos,
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: [],
      error: "Error al obtener el inventario de zapatos para el área de venta",
    };
  }
}
