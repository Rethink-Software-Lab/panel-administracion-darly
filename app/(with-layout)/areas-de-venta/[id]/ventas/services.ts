import { db } from "@/db/initial";
import {
  inventarioAjusteinventarioProductos,
  inventarioAreaventa,
  inventarioCategorias,
  inventarioCuentas,
  inventarioHistorialprecioventasalon,
  inventarioProducto,
  inventarioProductoinfo,
  inventarioTransacciones,
  inventarioUser,
  inventarioVentas,
} from "@/db/schema";
import { createSubqueryUltimoPrecioVentaProducto } from "@/db/subquerys";
import { ValidationError } from "@/lib/errors";
import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { searchParamsCache } from "./searchParams";

export async function getVentasAreaVenta(id: number) {
  const {
    p: page,
    l: limit,
    from,
    to,
    met,
    productos,
  } = searchParamsCache.all();

  const filterConditions = [];
  if (from && to) {
    filterConditions.push(
      gte(inventarioVentas.createdAt, from.toISOString()),
      lte(inventarioVentas.createdAt, to.toISOString())
    );
  }

  if (met) {
    filterConditions.push(eq(inventarioVentas.metodoPago, met));
  }

  if (productos) {
    filterConditions.push(inArray(inventarioProductoinfo.id, productos));
  }

  const safeLimit = Math.min(limit, 50);

  const whereCondition =
    filterConditions.length > 0
      ? and(eq(inventarioVentas.areaVentaId, id), ...filterConditions)
      : eq(inventarioVentas.areaVentaId, id);

  const offset = (page - 1) * safeLimit;

  try {
    const areaVenta = await db
      .select({
        id: inventarioAreaventa.id,
        nombre: inventarioAreaventa.nombre,
        cuenta: {
          id: inventarioCuentas.id,
          nombre: inventarioCuentas.nombre,
        },
      })
      .from(inventarioAreaventa)
      .leftJoin(
        inventarioCuentas,
        eq(inventarioAreaventa.cuentaId, inventarioCuentas.id)
      )
      .where(
        and(
          eq(inventarioAreaventa.id, id),
          eq(inventarioAreaventa.active, true)
        )
      )
      .limit(1);

    if (!areaVenta || areaVenta.length === 0) {
      throw new ValidationError("No se encontro la area de venta");
    }

    const subqueryHistoricoPrecioVenta =
      createSubqueryUltimoPrecioVentaProducto(inventarioProductoinfo.id);

    const allProductos = await db
      .select({
        id: inventarioProductoinfo.id,
        descripcion: inventarioProductoinfo.descripcion,
        precioVenta: subqueryHistoricoPrecioVenta.precio,
        isZapato: sql<boolean>`CASE WHEN ${inventarioCategorias.nombre} = 'Zapatos' THEN TRUE ELSE FALSE END`,
        disponible: sql<boolean>`CASE WHEN COUNT(CASE WHEN ${inventarioProducto.ventaId} IS NOT NULL THEN 1 END) = 0 AND COUNT(CASE WHEN ${inventarioAjusteinventarioProductos.ajusteinventarioId} IS NOT NULL THEN 1 END) = 0 THEN TRUE ELSE FALSE END`,
      })
      .from(inventarioProductoinfo)
      .innerJoin(
        inventarioCategorias,
        eq(inventarioProductoinfo.categoriaId, inventarioCategorias.id)
      )
      .innerJoin(
        inventarioProducto,
        eq(inventarioProductoinfo.id, inventarioProducto.infoId)
      )
      .leftJoin(
        inventarioAjusteinventarioProductos,
        eq(
          inventarioProducto.id,
          inventarioAjusteinventarioProductos.productoId
        )
      )
      .innerJoinLateral(subqueryHistoricoPrecioVenta, sql`true`)
      .where(eq(inventarioProducto.areaVentaId, id))
      .groupBy(
        inventarioProductoinfo.id,
        inventarioProductoinfo.descripcion,
        inventarioCategorias.id,
        subqueryHistoricoPrecioVenta.precio
      );

    const ventasConConteo = await db
      .select({
        importe: sql<number>`SUM((
              SELECT precio 
              FROM ${inventarioHistorialprecioventasalon} 
              WHERE ${inventarioHistorialprecioventasalon.productoInfoId} = ${inventarioProductoinfo.id}
              ORDER BY ${inventarioHistorialprecioventasalon.fechaInicio} DESC 
              LIMIT 1
            )) - SUM(${inventarioProductoinfo.pagoTrabajador})`,
        createdAt: inventarioVentas.createdAt,
        metodoPago: inventarioVentas.metodoPago,
        usuario: { id: inventarioUser.id, username: inventarioUser.username },
        descripcion: inventarioProductoinfo.descripcion,
        cantidad: count(inventarioProducto.id),
        id: inventarioVentas.id,
        totalCount: sql<number>`COUNT(*) OVER()`.as("total_count"),
      })
      .from(inventarioVentas)
      .innerJoin(
        inventarioProducto,
        eq(inventarioVentas.id, inventarioProducto.ventaId)
      )
      .innerJoin(
        inventarioProductoinfo,
        eq(inventarioProducto.infoId, inventarioProductoinfo.id)
      )
      .innerJoin(
        inventarioUser,
        eq(inventarioVentas.usuarioId, inventarioUser.id)
      )
      .where(whereCondition)
      .groupBy(
        inventarioVentas.id,
        inventarioUser.id,
        inventarioUser.username,
        inventarioProductoinfo.descripcion
      )
      .orderBy(desc(inventarioVentas.createdAt))
      .limit(safeLimit)
      .offset(offset);

    const totalCount = ventasConConteo[0]?.totalCount ?? 0;
    const pageCount = Math.ceil(totalCount / safeLimit);

    const ventas = ventasConConteo.map(({ totalCount, ...rest }) => rest);

    const currentMonth = new Date().getMonth() + 1;
    const cuentas_bancarias = await db
      .select({
        id: inventarioCuentas.id,
        nombre: inventarioCuentas.nombre,
        banco: inventarioCuentas.banco,
        disponible: sql<boolean>`CASE WHEN COALESCE(SUM(CASE WHEN ${inventarioTransacciones.tipo} = 'INGRESO' AND EXTRACT(MONTH FROM ${inventarioTransacciones.createdAt}) = ${currentMonth} THEN ${inventarioTransacciones.cantidad} ELSE 0 END), 0) >= 120000 THEN FALSE ELSE TRUE END`,
      })
      .from(inventarioCuentas)
      .where(
        and(
          eq(inventarioCuentas.tipo, "BANCARIA"),
          eq(inventarioCuentas.active, true)
        )
      )
      .leftJoin(
        inventarioTransacciones,
        eq(inventarioCuentas.id, inventarioTransacciones.cuentaId)
      )
      .groupBy(inventarioCuentas.id)
      .orderBy(desc(inventarioCuentas.id));
    return {
      error: null,
      data: {
        ventas,
        area_venta: areaVenta?.[0],
        allProductos,
        cuentas_bancarias,
      },
      meta: {
        pageCount,
        totalCount,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      data: {
        ventas: [],
        area_venta: null,
        allProductos: [],
        cuentas_bancarias: [],
      },
      meta: {
        pageCount: 0,
        totalCount: 0,
      },
      error: "Error al obtener las ventas por área de venta",
    };
  }
}
