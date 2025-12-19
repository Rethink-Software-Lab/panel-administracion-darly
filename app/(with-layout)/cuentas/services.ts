import { Moneda, TasaDeCambio, TipoCuenta, TipoTransferencia } from "./types";
import { db } from "@/db/initial";
import {
  inventarioAjusteinventarioProductos,
  inventarioCuentas,
  inventarioProducto,
  inventarioProductoinfo,
  inventarioTransacciones,
  inventarioUser,
} from "@/db/schema";
import { ValidationError } from "@/lib/errors";
import { and, desc, eq, gte, inArray, isNull, lte, sql, or } from "drizzle-orm";
import { searchParamsCache } from "./searchParams";
import { alias } from "drizzle-orm/pg-core";
import { createSubqueryUltimoPrecioCostoProducto } from "@/db/subquerys";

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
      .where(eq(inventarioCuentas.active, true))
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

async function getTasasDeCambio() {
  /*  "use cache";
  cacheLife({ revalidate: 4 * 60 * 60, expire: 24 * 60 * 60 }); // 4 horas */

  if (process.env.NODE_ENV === "development") return { tasas: { USD: 450 } };

  const tasaDeCambio: TasaDeCambio = await fetch(process.env.ELTOQUE_API_URL!, {
    headers: {
      Authorization: `Bearer ${process.env.ELTOQUE_API_KEY}`,
    },
    next: { revalidate: 4 * 60 * 60 },
  })
    .then((res) => res.json())
    .catch((e) => {
      console.error(`Error al obtener tasa de cambio`, e);
      throw new Error("Error al obtener tasa de cambio");
    });

  return tasaDeCambio;
}

export async function getSaldos() {
  try {
    const subQueryUltimoPrecioCostoSalon =
      createSubqueryUltimoPrecioCostoProducto(inventarioProductoinfo.id);

    const saldoInventariosDb = await db
      .select({
        precioVenta: subQueryUltimoPrecioCostoSalon.precio,
      })
      .from(inventarioProducto)
      .innerJoin(
        inventarioProductoinfo,
        eq(inventarioProducto.infoId, inventarioProductoinfo.id)
      )
      .innerJoinLateral(subQueryUltimoPrecioCostoSalon, sql`true`)
      .leftJoin(
        inventarioAjusteinventarioProductos,
        eq(
          inventarioAjusteinventarioProductos.productoId,
          inventarioProducto.id
        )
      )
      .where(
        and(
          isNull(inventarioProducto.ventaId),
          isNull(inventarioAjusteinventarioProductos.id)
        )
      );

    const saldoInventarios = saldoInventariosDb.reduce(
      (acc, prod) => acc + parseFloat(prod.precioVenta),
      0
    );

    const cuentas = await db
      .select({
        saldo: inventarioCuentas.saldo,
        tipo: inventarioCuentas.tipo,
        mondea: inventarioCuentas.moneda,
      })
      .from(inventarioCuentas)
      .where(eq(inventarioCuentas.active, true));

    const saldoCuentasEfectivoCUP = cuentas
      .filter((c) => c.tipo === TipoCuenta.EFECTIVO && c.mondea === Moneda.CUP)
      .reduce((acum, cuenta) => acum + parseFloat(cuenta.saldo), 0);

    const saldoCuentasEfectivoUSD = cuentas
      .filter((c) => c.tipo === TipoCuenta.EFECTIVO && c.mondea === Moneda.USD)
      .reduce((acum, cuenta) => acum + parseFloat(cuenta.saldo), 0);

    const saldoCuentasBancarias = cuentas
      .filter((c) => c.tipo === TipoCuenta.BANCARIA)
      .reduce((acum, cuenta) => acum + parseFloat(cuenta.saldo), 0);

    const saldoZelle = cuentas
      .filter((c) => c.tipo === TipoCuenta.ZELLE)
      .reduce((acum, cuenta) => acum + parseFloat(cuenta.saldo), 0);

    const tasasDeCambio = await getTasasDeCambio();
    const conversionUSD = saldoCuentasEfectivoUSD * tasasDeCambio.tasas.USD;

    return {
      data: {
        saldoInventarios,
        saldoCuentasEfectivoCUP,
        saldoCuentasEfectivoUSD,
        saldoCuentasBancarias,
        saldoZelle,
        saldoTotal:
          saldoInventarios +
          saldoCuentasEfectivoCUP +
          saldoCuentasBancarias +
          conversionUSD +
          saldoZelle,
      },
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al obtener los saldos.",
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
        tipo: inventarioCuentas.tipo,
        banco: inventarioCuentas.banco,
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
      data: null,
      meta: null,
      error: "Error al conectar con el servidor.",
    };
  }
}
