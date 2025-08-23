import { EndpointOneAreaVenta } from "./types";
import { db } from "@/db/initial";
import {
  inventarioAjusteinventarioProductos,
  inventarioAreaventa,
  inventarioCategorias,
  inventarioCuentas,
  inventarioHistorialprecioventasalon,
  producto,
  inventarioProductoinfo,
  inventarioTransacciones,
  inventarioUser,
  inventarioVentas,
} from "@/db/schema";
import { and, eq, gte, isNull, not, sql, count, desc, gt } from "drizzle-orm";
import { ValidationError } from "@/lib/errors";

export async function getAreaVenta(
  id: number
): Promise<{ data: EndpointOneAreaVenta | null; error: string | null }> {
  try {
    const areaVenta = await db
      .select({
        id: inventarioAreaventa.id,
        nombre: inventarioAreaventa.nombre,
        isMesa: inventarioAreaventa.isMesa,
      })
      .from(inventarioAreaventa)
      .where(eq(inventarioAreaventa.id, id))
      .limit(1);

    if (!areaVenta || areaVenta.length === 0) {
      throw new ValidationError("No se encontro la area de venta");
    }

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
        cantidad: count(producto.id),
        categoria_nombre: inventarioCategorias.nombre,
      })
      .from(inventarioProductoinfo)
      .innerJoin(producto, eq(inventarioProductoinfo.id, producto.infoId))
      .leftJoin(
        inventarioCategorias,
        eq(inventarioProductoinfo.categoriaId, inventarioCategorias.id)
      )
      .leftJoin(
        inventarioAjusteinventarioProductos,
        eq(producto.id, inventarioAjusteinventarioProductos.productoId)
      )
      .where(
        and(
          isNull(producto.ventaId),
          isNull(inventarioAjusteinventarioProductos.ajusteinventarioId),
          eq(producto.areaVentaId, Number(id))
        )
      )
      .groupBy(inventarioProductoinfo.id, inventarioCategorias.nombre)
      .having(({ cantidad }) =>
        and(gte(count(), 1), not(eq(inventarioCategorias.nombre, "Zapatos")))
      );

    const zapatos = await db
      .select({
        id: producto.id,
        descripcion: inventarioProductoinfo.descripcion,
        color: producto.color,
        numero: producto.numero,
      })
      .from(producto)
      .innerJoin(
        inventarioProductoinfo,
        eq(producto.infoId, inventarioProductoinfo.id)
      )
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
          eq(inventarioCategorias.nombre, "Zapatos"),
          isNull(producto.ventaId),
          eq(producto.areaVentaId, Number(id)),
          isNull(inventarioAjusteinventarioProductos.ajusteinventarioId)
        )
      )
      .orderBy(desc(producto.id));

    const allProductos = await db
      .select({
        id: inventarioProductoinfo.id,
        descripcion: inventarioProductoinfo.descripcion,
        isZapato: sql<boolean>`CASE WHEN ${inventarioCategorias.nombre} = 'Zapatos' THEN TRUE ELSE FALSE END`,
      })
      .from(inventarioProductoinfo)
      .innerJoin(
        inventarioCategorias,
        eq(inventarioProductoinfo.categoriaId, inventarioCategorias.id)
      )
      .innerJoin(producto, eq(inventarioProductoinfo.id, producto.infoId))
      .leftJoin(
        inventarioAjusteinventarioProductos,
        eq(producto.id, inventarioAjusteinventarioProductos.productoId)
      )
      .where(
        and(
          eq(producto.areaVentaId, Number(id)),
          isNull(producto.ventaId),
          isNull(inventarioAjusteinventarioProductos.ajusteinventarioId)
        )
      )
      .groupBy(
        inventarioProductoinfo.id,
        inventarioProductoinfo.descripcion,
        inventarioCategorias.id
      );

    const categorias = await db.select().from(inventarioCategorias);

    const ventas = await db
      .select({
        importe: sql<number>`SUM((
          SELECT precio 
          FROM ${inventarioHistorialprecioventasalon} 
          WHERE ${inventarioHistorialprecioventasalon.productoInfoId} = ${inventarioProductoinfo.id}
          ORDER BY ${inventarioHistorialprecioventasalon.fechaInicio} DESC 
          LIMIT 1
        )) - SUM(${inventarioProductoinfo.pagoTrabajador})`,
        created_at: inventarioVentas.createdAt,
        metodo_pago: inventarioVentas.metodoPago,
        usuario: { id: inventarioUser.id, username: inventarioUser.username },
        descripcion: inventarioProductoinfo.descripcion,
        cantidad: count(producto.id),
        id: inventarioVentas.id,
      })
      .from(inventarioVentas)
      .innerJoin(producto, eq(inventarioVentas.id, producto.ventaId))
      .innerJoin(
        inventarioProductoinfo,
        eq(producto.infoId, inventarioProductoinfo.id)
      )
      .innerJoin(
        inventarioUser,
        eq(inventarioVentas.usuarioId, inventarioUser.id)
      )
      .where(
        and(
          eq(inventarioVentas.areaVentaId, Number(id)),
          gt(
            inventarioVentas.createdAt,
            new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          )
        )
      )
      .groupBy(
        inventarioVentas.id,
        inventarioUser.id,
        inventarioUser.username,
        inventarioProductoinfo.descripcion
      )
      .orderBy(desc(inventarioVentas.createdAt));

    const currentMonth = new Date().getMonth() + 1;
    const cuentas_bancarias = await db
      .select({
        id: inventarioCuentas.id,
        nombre: inventarioCuentas.nombre,
        banco: inventarioCuentas.banco,
        disponible: sql<boolean>`CASE WHEN COALESCE(SUM(CASE WHEN ${inventarioTransacciones.tipo} = 'INGRESO' AND EXTRACT(MONTH FROM ${inventarioTransacciones.createdAt}) = ${currentMonth} THEN ${inventarioTransacciones.cantidad} ELSE 0 END), 0) >= 120000 THEN FALSE ELSE TRUE END`,
      })
      .from(inventarioCuentas)
      .where(eq(inventarioCuentas.tipo, "BANCARIA"))
      .leftJoin(
        inventarioTransacciones,
        eq(inventarioCuentas.id, inventarioTransacciones.cuentaId)
      )
      .groupBy(inventarioCuentas.id)
      .orderBy(desc(inventarioCuentas.id));
    return {
      error: null,
      data: {
        inventario: {
          productos: productoInfo,
          zapatos,
          categorias,
        },
        ventas,
        area_venta: areaVenta?.[0],
        all_productos: allProductos,
        cuentas_bancarias,
      },
    };
  } catch (e) {
    console.error(e);
    if (e instanceof ValidationError) {
      return {
        data: null,
        error: e.message,
      };
    }
    return {
      data: null,
      error: "Error al obtener la area de venta.",
    };
  }
}
