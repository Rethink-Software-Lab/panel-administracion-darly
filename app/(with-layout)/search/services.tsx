import { db } from "@/db/initial";
import { inventarioProducto, inventarioProductoinfo } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { searchParamsCache } from "./searchParams";
import { forbidden } from "next/navigation";

export async function searchProduct() {
  const { n } = await searchParamsCache.all();

  if (!n || n.length === 0) forbidden();

  try {
    const productCounts = db
      .select({
        infoId: inventarioProducto.infoId,
        numero: inventarioProducto.numero,
        cantidad: sql<number>`count(${inventarioProducto.id})`
          .mapWith(Number)
          .as("cantidad"),
      })
      .from(inventarioProducto)
      .where(
        inArray(
          inventarioProducto.numero,
          n.map((n) => n.toString())
        )
      )
      .groupBy(inventarioProducto.infoId, inventarioProducto.numero)
      .as("product_counts");

    const results = await db
      .with(productCounts)
      .select({
        id: inventarioProductoinfo.id,
        nombre: inventarioProductoinfo.descripcion,
        productos: sql<{ numero: string; cantidad: number }[]>`
        json_agg(
          json_build_object(
            'numero', ${productCounts.numero},
            'cantidad', ${productCounts.cantidad}
          )
        )
      `.as("productos"),
      })
      .from(inventarioProductoinfo)
      .innerJoin(
        productCounts,
        eq(inventarioProductoinfo.id, productCounts.infoId)
      )
      .groupBy(inventarioProductoinfo.id, inventarioProductoinfo.descripcion);

    return {
      error: null,
      data: results,
    };
  } catch (e) {
    console.error(e);
    return {
      data: [],
      error: "Error al conectar con el servidor.",
    };
  }
}
