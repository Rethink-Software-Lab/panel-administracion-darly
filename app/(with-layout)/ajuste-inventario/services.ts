import { ResponseAjusteInventario } from "./types";
import { db } from "@/db/initial";
import {
  inventarioAjusteinventario,
  inventarioAjusteinventarioProductos,
  inventarioAreaventa,
  inventarioCategorias,
  producto,
  inventarioProductoinfo,
  inventarioUser,
} from "@/db/schema";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";

export async function getAjustesInventario(): Promise<{
  data: ResponseAjusteInventario | null;
  error: string | null;
}> {
  try {
    const [ajustes, productosPorAjuste, areas_ventas, productos_info] =
      await Promise.all([
        db
          .select({
            id: inventarioAjusteinventario.id,
            createdAt: inventarioAjusteinventario.createdAt,
            usuario: inventarioUser.username,
            motivo: inventarioAjusteinventario.motivo,
          })
          .from(inventarioAjusteinventario)
          .innerJoin(
            inventarioUser,
            eq(inventarioAjusteinventario.usuarioId, inventarioUser.id)
          )
          .orderBy(desc(inventarioAjusteinventario.id)),

        db
          .select({
            ajusteId: inventarioAjusteinventarioProductos.ajusteinventarioId,
            id: inventarioProductoinfo.id,
            descripcion: inventarioProductoinfo.descripcion,
            total_transfers: count(),
          })
          .from(inventarioAjusteinventarioProductos)
          .innerJoin(
            producto,
            eq(producto.id, inventarioAjusteinventarioProductos.productoId)
          )
          .innerJoin(
            inventarioProductoinfo,
            eq(inventarioProductoinfo.id, producto.infoId)
          )
          .groupBy(
            inventarioAjusteinventarioProductos.ajusteinventarioId,
            inventarioProductoinfo.id,
            inventarioProductoinfo.descripcion
          ),

        db.select().from(inventarioAreaventa),

        db
          .selectDistinct({
            id: inventarioProductoinfo.id,
            descripcion: inventarioProductoinfo.descripcion,
            isZapato: sql<boolean>`${inventarioCategorias.nombre} = 'Zapatos'`,
          })
          .from(inventarioProductoinfo)
          .innerJoin(producto, eq(inventarioProductoinfo.id, producto.infoId))
          .leftJoin(
            inventarioAjusteinventarioProductos,
            eq(producto.id, inventarioAjusteinventarioProductos.productoId)
          )
          .innerJoin(
            inventarioCategorias,
            eq(inventarioCategorias.id, inventarioProductoinfo.categoriaId)
          )
          .where(
            and(
              isNull(producto.ventaId),
              isNull(inventarioAjusteinventarioProductos)
            )
          ),
      ]);

    const productosAgrupados = productosPorAjuste.reduce((acc, row) => {
      const ajusteId = row.ajusteId;
      if (!acc[ajusteId]) acc[ajusteId] = [];
      acc[ajusteId].push({
        id: row.id,
        descripcion: row.descripcion,
        total_transfers: row.total_transfers,
      });
      return acc;
    }, {} as Record<number, { id: number; descripcion: string; total_transfers: number }[]>);

    const resultados = ajustes.map((ajuste) => ({
      id: ajuste.id,
      created_at: ajuste.createdAt,
      usuario: ajuste.usuario,
      motivo: ajuste.motivo,
      productos: productosAgrupados[ajuste.id] ?? [],
    }));

    return {
      error: null,
      data: {
        ajustes: resultados,
        areas_ventas,
        productos_info,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al obtener los ajustes.",
    };
  }
}
