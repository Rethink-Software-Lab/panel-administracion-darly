import { db } from "@/db/initial";
import { inventarioProductosCafeteria } from "@/db/schema";
import {
  createSubqueryUltimoPrecioCostoProductoCafeteria,
  createSubqueryUltimoPrecioVentaProductoCafeteria,
} from "@/db/subquerys";
import { desc, eq, sql } from "drizzle-orm";

export async function ProductosCafeteria() {
  try {
    const subQueryUltimoPrecioCostoProductoCafeteria =
      createSubqueryUltimoPrecioCostoProductoCafeteria(
        inventarioProductosCafeteria.id
      );

    const subQueryUltimoPrecioVentaProductoCafeteria =
      createSubqueryUltimoPrecioVentaProductoCafeteria(
        inventarioProductosCafeteria.id
      );

    const productosDB = await db
      .select({
        id: inventarioProductosCafeteria.id,
        nombre: inventarioProductosCafeteria.nombre,
        precioCosto: subQueryUltimoPrecioCostoProductoCafeteria.precio,
        precioVenta: subQueryUltimoPrecioVentaProductoCafeteria.precio,
        isIngrediente: inventarioProductosCafeteria.isIngrediente,
      })
      .from(inventarioProductosCafeteria)
      .innerJoinLateral(subQueryUltimoPrecioCostoProductoCafeteria, sql`true`)
      .innerJoinLateral(subQueryUltimoPrecioVentaProductoCafeteria, sql`true`)
      .where(eq(inventarioProductosCafeteria.active, true))
      .orderBy(desc(inventarioProductosCafeteria.id));

    const productos = productosDB.map((item) => ({
      ...item,
      precioCosto: parseFloat(item.precioCosto),
      precioVenta: parseFloat(item.precioVenta),
    }));

    return {
      error: null,
      data: productos,
    };
  } catch (e) {
    return {
      data: null,
      error: "Error al obtener los productos de la cafetería.",
    };
  }
}
