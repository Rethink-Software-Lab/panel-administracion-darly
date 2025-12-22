import { db } from "@/db/initial";
import {
  inventarioAjusteinventarioProductos,
  inventarioCategorias,
  inventarioHistorialprecioventasalon,
  inventarioProducto,
  inventarioProductoinfo,
} from "@/db/schema";
import { and, count, eq, gte, isNull, not, sql } from "drizzle-orm";

export async function getInventarioAreaVenta(id: number) {
  try {
    const productoInfo = await db
      .select({
        id: inventarioProductoinfo.id,
        descripcion: inventarioProductoinfo.descripcion,
        precio_venta: sql<string>`(
              SELECT precio 
              FROM ${inventarioHistorialprecioventasalon} 
              WHERE ${inventarioHistorialprecioventasalon.productoInfoId} = ${inventarioProductoinfo.id}
              ORDER BY ${inventarioHistorialprecioventasalon.fechaInicio} DESC 
              LIMIT 1
            )`,
        cantidad: count(inventarioProducto.id),
        categoria__nombre: inventarioCategorias.nombre,
      })
      .from(inventarioProductoinfo)
      .innerJoin(
        inventarioProducto,
        eq(inventarioProductoinfo.id, inventarioProducto.infoId)
      )
      .leftJoin(
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
          isNull(inventarioProducto.ventaId),
          isNull(inventarioAjusteinventarioProductos.ajusteinventarioId),
          eq(inventarioProducto.areaVentaId, Number(id))
        )
      )
      .groupBy(inventarioProductoinfo.id, inventarioCategorias.nombre)
      .having(({ cantidad }) =>
        and(gte(count(), 1), not(eq(inventarioCategorias.nombre, "Zapatos")))
      );

    const categorias = await db.select().from(inventarioCategorias);

    return {
      data: { productos: productoInfo, categorias },
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: {
        productos: [],
        categorias: [],
      },
      error: "Error al obtener el inventario del área de venta",
    };
  }
}
