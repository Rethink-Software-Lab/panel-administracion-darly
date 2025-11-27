import { TipoTransferencia } from "./types";
import { db } from "@/db/initial";
import {
  inventarioCuentas,
  inventarioTransacciones,
  inventarioUser,
} from "@/db/schema";
import { ValidationError } from "@/lib/errors";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { searchParamsCache } from "./searchParams";
import { alias } from "drizzle-orm/pg-core";

export async function GetTarjetas() {
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
        moneda: inventarioCuentas.moneda,
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

export async function getTransacciones() {
  const {
    p: page,
    l: limit,
    from,
    to,
    type,
    accounts,
  } = searchParamsCache.all();
  try {
    const filterConditions = [];
    if (from && to) {
      filterConditions.push(
        gte(inventarioTransacciones.createdAt, from.toISOString()),
        lte(inventarioTransacciones.createdAt, to.toISOString())
      );
    }

    if (type) {
      filterConditions.push(eq(inventarioTransacciones.tipo, type));
    }

    if (accounts) {
      filterConditions.push(
        inArray(
          inventarioTransacciones.cuentaId,
          accounts.map((account) => account)
        )
      );
    }

    const safeLimit = Math.min(limit, 50);

    const whereCondition =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const offset = (page - 1) * safeLimit;

    const aliasCuentaOrigen = alias(inventarioCuentas, "cuenta_origen");
    const aliasCuentaDestino = alias(inventarioCuentas, "cuenta_destino");

    const transaccionesConConteo = await db
      .select({
        id: inventarioTransacciones.id,
        cuenta: inventarioCuentas.nombre,
        tipo: inventarioTransacciones.tipo,
        usuario: inventarioUser.username,
        createdAt: inventarioTransacciones.createdAt,
        cantidad: inventarioTransacciones.cantidad,
        moneda: inventarioTransacciones.moneda,
        descripcion: inventarioTransacciones.descripcion,
        tipoCambio: inventarioTransacciones.tipoCambio,
        cuentaOrigen: aliasCuentaOrigen.nombre,
        cuentaDestino: aliasCuentaDestino.nombre,
        totalCount: sql<number>`COUNT(*) OVER()`.as("total_count"),
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
      .leftJoin(
        aliasCuentaOrigen,
        eq(inventarioTransacciones.cuentaOrigenId, aliasCuentaOrigen.id)
      )
      .leftJoin(
        aliasCuentaDestino,
        eq(inventarioTransacciones.cuentaDestinoId, aliasCuentaDestino.id)
      )
      .where(whereCondition)
      .orderBy(desc(inventarioTransacciones.id))
      .limit(safeLimit)
      .offset(offset);

    const totalCount = transaccionesConConteo[0]?.totalCount ?? 0;
    const pageCount = Math.ceil(totalCount / safeLimit);

    const transacciones = transaccionesConConteo.map(
      ({ totalCount, ...rest }) => rest
    );

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
        transacciones,
        cuentas,
      },
      meta: {
        pageCount,
        totalCount,
      },
    };
  } catch (e) {
    console.error(e);
    if (e instanceof ValidationError) {
      return {
        data: null,
        meta: null,
        error: e.message,
      };
    }
    return {
      data: null,
      meta: null,
      error: "Error al conectar con el servidor.",
    };
  }
}
