import { db } from "@/db/initial";
import {
  inventarioInventarioAlmacenCafeteria,
  inventarioProductosCafeteria,
} from "@/db/schema";
import { createSubqueryUltimoPrecioVentaProductoCafeteria } from "@/db/subquerys";
import { eq, gt, sql } from "drizzle-orm";

export async function inventarioAlmacenCafeteria() {
  try {
    const subqueryUltimoPrecioVentaProductoCafeteria =
      createSubqueryUltimoPrecioVentaProductoCafeteria(
        inventarioProductosCafeteria.id
      );

    const productosDb = await db
      .select({
        id: inventarioProductosCafeteria.id,
        nombre: inventarioProductosCafeteria.nombre,
        isIngrediente: inventarioProductosCafeteria.isIngrediente,
        cantidad: inventarioInventarioAlmacenCafeteria.cantidad,
        precioVenta: subqueryUltimoPrecioVentaProductoCafeteria.precio,
      })
      .from(inventarioProductosCafeteria)
      .innerJoin(
        inventarioInventarioAlmacenCafeteria,
        eq(
          inventarioInventarioAlmacenCafeteria.productoId,
          inventarioProductosCafeteria.id
        )
      )
      .innerJoinLateral(subqueryUltimoPrecioVentaProductoCafeteria, sql`true`)
      .where(gt(inventarioInventarioAlmacenCafeteria.cantidad, "0"));

    const productos = productosDb.map((item) => ({
      ...item,
      cantidad: parseFloat(item.cantidad),
      precioVenta: parseFloat(item.precioVenta),
    }));
    return {
      error: null,
      data: productos,
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al obtener el inventario del almacén de cafetería",
    };
  }
}
