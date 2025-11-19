import { db } from "@/db/initial";
import {
  inventarioInventarioAreaCafeteria,
  inventarioProductosCafeteria,
} from "@/db/schema";
import { createSubqueryUltimoPrecioVentaProductoCafeteria } from "@/db/subquerys";
import { and, eq, sql } from "drizzle-orm";

export async function ingredientesCafeteria() {
  try {
    const subqueryUltimoPrecioVentaProductoCafeteria =
      createSubqueryUltimoPrecioVentaProductoCafeteria(
        inventarioProductosCafeteria.id
      );

    const productos = await db
      .select({
        id: inventarioProductosCafeteria.id,
        nombre: inventarioProductosCafeteria.nombre,
        precioVenta: subqueryUltimoPrecioVentaProductoCafeteria.precio,
        cantidad: inventarioInventarioAreaCafeteria.cantidad,
      })
      .from(inventarioProductosCafeteria)
      .innerJoinLateral(subqueryUltimoPrecioVentaProductoCafeteria, sql`true`)
      .innerJoin(
        inventarioInventarioAreaCafeteria,
        eq(
          inventarioInventarioAreaCafeteria.productoId,
          inventarioProductosCafeteria.id
        )
      )
      .where(
        and(
          sql`${inventarioInventarioAreaCafeteria.cantidad} > 0`,
          eq(inventarioProductosCafeteria.isIngrediente, true)
        )
      );

    return {
      data: productos,
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: [],
      error: "Error al obtener los ingredientes.",
    };
  }
}
