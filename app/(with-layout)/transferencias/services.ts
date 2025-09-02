import { db } from "@/db/initial";
import {
  inventarioAjusteinventarioProductos,
  inventarioAreaventa,
  inventarioCategorias,
  producto,
  inventarioProductoinfo,
  inventarioTransferencia,
  inventarioTransferenciaProductos,
  inventarioUser,
} from "@/db/schema";
import { and, count, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { ProductosTransfer, ResponseTransferencias } from "./types";
import { revalidatePath } from "next/cache";

export async function getTransferencias(): Promise<{
  data: ResponseTransferencias | null;
  error: string | null;
}> {
  try {
    const areaVentaDe = alias(inventarioAreaventa, "de");
    const areaVentaPara = alias(inventarioAreaventa, "para");

    const productosAgg = db
      .select({
        transferenciaId: inventarioTransferenciaProductos.transferenciaId,
        productoId: inventarioProductoinfo.id,
        descripcion: inventarioProductoinfo.descripcion,
        cantidad: count(inventarioTransferenciaProductos.id).as("cantidad"),
      })
      .from(inventarioTransferenciaProductos)
      .innerJoin(
        producto,
        eq(inventarioTransferenciaProductos.productoId, producto.id)
      )
      .innerJoin(
        inventarioProductoinfo,
        eq(producto.infoId, inventarioProductoinfo.id)
      )
      .groupBy(
        inventarioTransferenciaProductos.transferenciaId,
        inventarioProductoinfo.id,
        inventarioProductoinfo.descripcion
      )
      .as("productosAgg");

    const [transferencias, areas_ventas, productos_info] = await Promise.all([
      await db
        .select({
          id: inventarioTransferencia.id,
          created_at: inventarioTransferencia.createdAt,
          usuario: inventarioUser.username,
          de: areaVentaDe.nombre,
          para: areaVentaPara.nombre,
          productos: sql<ProductosTransfer[]>`json_agg(
            json_build_object(
              'id', ${productosAgg.productoId},
              'descripcion', ${productosAgg.descripcion},
              'total_transfers', ${productosAgg.cantidad}
            )
          )`.as("productos"),
        })
        .from(inventarioTransferencia)
        .leftJoin(
          inventarioUser,
          eq(inventarioTransferencia.usuarioId, inventarioUser.id)
        )
        .leftJoin(areaVentaDe, eq(inventarioTransferencia.deId, areaVentaDe.id))
        .leftJoin(
          areaVentaPara,
          eq(inventarioTransferencia.paraId, areaVentaPara.id)
        )
        .innerJoin(
          productosAgg,
          eq(productosAgg.transferenciaId, inventarioTransferencia.id)
        )
        .groupBy(
          inventarioTransferencia.id,
          inventarioUser.username,
          areaVentaDe.nombre,
          areaVentaPara.nombre
        )
        .orderBy(desc(inventarioTransferencia.id)),
      await db.select().from(inventarioAreaventa),
      await db
        .selectDistinct({
          id: inventarioProductoinfo.id,
          descripcion: inventarioProductoinfo.descripcion,
          isZapato: sql<boolean>`${inventarioCategorias.nombre} = 'Zapatos'`,
        })
        .from(inventarioProductoinfo)
        .innerJoin(producto, eq(producto.infoId, inventarioProductoinfo.id))
        .innerJoin(
          inventarioCategorias,
          eq(inventarioProductoinfo.categoriaId, inventarioCategorias.id)
        )
        .leftJoin(
          inventarioAjusteinventarioProductos,
          eq(producto.id, inventarioAjusteinventarioProductos.productoId)
        )
        .where(
          and(
            isNotNull(producto.areaVentaId),
            eq(producto.almacenRevoltosa, false),
            isNull(producto.ventaId),
            isNull(inventarioAjusteinventarioProductos)
          )
        )
        .orderBy(desc(inventarioProductoinfo.id)),
    ]);

    return {
      error: null,
      data: {
        transferencias,
        areas_ventas,
        productos_info,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al obtener las transferencias.",
    };
  }
}
