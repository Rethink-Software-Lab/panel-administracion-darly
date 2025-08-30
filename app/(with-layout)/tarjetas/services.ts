import {
  ResponseTarjetas,
  TipoTransferencia,
  ResponseTransacciones,
} from "./types";
import { db } from "@/db/initial";
import {
  inventarioCuentas,
  inventarioTransacciones,
  inventarioUser,
} from "@/db/schema";
import { and, asc, desc, eq, gt, gte, lt, sql } from "drizzle-orm";

export async function GetTarjetas(): Promise<{
  data: ResponseTarjetas | null;
  error: string | null;
}> {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    inicioMes.setHours(0, 0, 0, 0);

    const cuentas = await db
      .select({
        id: inventarioCuentas.id,
        nombre: inventarioCuentas.nombre,
        tipo: inventarioCuentas.tipo,
        banco: inventarioCuentas.banco,
        saldo: inventarioCuentas.saldo,
        total_transferencias_mes: sql<number>`coalesce(sum(${inventarioTransacciones.cantidad}), 0)`,
      })
      .from(inventarioCuentas)
      .leftJoin(
        inventarioTransacciones,
        and(
          eq(inventarioCuentas.id, inventarioTransacciones.cuentaId),
          eq(inventarioTransacciones.tipo, TipoTransferencia.INGRESO),
          gte(inventarioTransacciones.createdAt, inicioMes.toISOString())
        )
      )
      .orderBy(desc(inventarioCuentas.tipo))
      .groupBy(inventarioCuentas.id);

    return {
      error: null,
      data: {
        tarjetas: cuentas,
        total_balance: cuentas.reduce(
          (acum, cuenta) => acum + Number(cuenta.saldo),
          0
        ),
      },
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al conectar con el servidor.",
    };
  }
}

export async function getTransacciones({
  cursor,
  direction = "next",
  limit = 10,
}: {
  cursor?: number;
  direction?: string;
  limit?: number;
}): Promise<ResponseTransacciones> {
  try {
    let whereCondition;
    let orderBy;

    if (cursor) {
      if (direction === "next") {
        whereCondition = lt(inventarioTransacciones.id, cursor);
        orderBy = desc(inventarioTransacciones.id);
      } else {
        whereCondition = gt(inventarioTransacciones.id, cursor);
        orderBy = asc(inventarioTransacciones.id);
      }
    } else {
      whereCondition = undefined;
      orderBy = desc(inventarioTransacciones.id);
    }

    const query = db
      .select({
        id: inventarioTransacciones.id,
        cuenta: inventarioCuentas.nombre,
        tipo: inventarioTransacciones.tipo,
        usuario: inventarioUser.username,
        createdAt: inventarioTransacciones.createdAt,
        cantidad: inventarioTransacciones.cantidad,
        descripcion: inventarioTransacciones.descripcion,
        canDelete: sql<boolean>`CASE 
          WHEN ${inventarioTransacciones.ventaId} IS NULL 
          AND ${inventarioTransacciones.ventaCafeteriaId} IS NULL 
          AND ${inventarioTransacciones.entradaId} IS NULL 
          AND ${inventarioTransacciones.entradaCafeteriaId} IS NULL
          THEN TRUE 
          ELSE FALSE 
        END`,
      })
      .from(inventarioTransacciones)
      .leftJoin(
        inventarioUser,
        eq(inventarioTransacciones.usuarioId, inventarioUser.id)
      )
      .innerJoin(
        inventarioCuentas,
        eq(inventarioTransacciones.cuentaId, inventarioCuentas.id)
      )
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit + 1);

    let rows = await query;

    const hasMore = rows.length > limit;
    let result = rows.slice(0, limit);

    let hasNextPage = false;
    let hasPrevPage = false;

    if (direction === "next") {
      hasNextPage = hasMore;
      hasPrevPage = cursor != null;
    } else {
      hasPrevPage = hasMore;
      hasNextPage = cursor != null;
      result = result.reverse();
    }

    if (!cursor) {
      hasNextPage = hasMore;
    }

    const nextCursor = hasNextPage
      ? result[result.length - 1]?.id ?? null
      : null;
    const prevCursor = hasPrevPage ? result[0]?.id ?? null : null;

    const count = await db.$count(inventarioTransacciones);
    const pageCount = Math.ceil(count / limit);

    const cuentas = await db
      .select({
        id: inventarioCuentas.id,
        nombre: inventarioCuentas.nombre,
        tipo: inventarioCuentas.tipo,
        banco: inventarioCuentas.banco,
      })
      .from(inventarioCuentas);

    return {
      error: null,
      data: {
        transacciones: result,
        cuentas,
      },
      meta: {
        nextCursor,
        prevCursor,
        hasNext: hasNextPage,
        hasPrev: hasPrevPage,
        pageCount,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      meta: null,
      error: "Error al conectar con el servidor.",
    };
  }
}
