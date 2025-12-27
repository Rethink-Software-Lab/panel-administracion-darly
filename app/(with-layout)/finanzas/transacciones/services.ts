import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { searchParamsCache } from "./searchParams";
import {
  inventarioCuentas,
  inventarioTransacciones,
  inventarioUser,
} from "@/db/schema";
import { db } from "@/db/initial";
import { ValidationError } from "@/lib/errors";
import { alias } from "drizzle-orm/pg-core";

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
        or(
          inArray(
            inventarioTransacciones.cuentaId,
            accounts.map((account) => account)
          ),
          inArray(
            inventarioTransacciones.cuentaOrigenId,
            accounts.map((account) => account)
          ),
          inArray(
            inventarioTransacciones.cuentaDestinoId,
            accounts.map((account) => account)
          )
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
      })
      .from(inventarioCuentas)
      .where(eq(inventarioCuentas.active, true));

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
      data: {
        transacciones: [],
        cuentas: [],
      },
      meta: null,
      error: "Error al conectar con el servidor.",
    };
  }
}
