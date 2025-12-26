import { Moneda, TasaDeCambio, TipoCuenta } from "./transacciones/types";
import { db } from "@/db/initial";
import {
  inventarioAjusteinventarioProductos,
  inventarioCuentas,
  inventarioProducto,
  inventarioProductoinfo,
} from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { createSubqueryUltimoPrecioCostoProducto } from "@/db/subquerys";

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
