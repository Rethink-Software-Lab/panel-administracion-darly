import { Moneda, TipoCuenta } from "./transacciones/types";
import { db } from "@/db/initial";
import {
  inventarioAjusteinventarioProductos,
  inventarioCuentas,
  inventarioProducto,
  inventarioProductoinfo,
} from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { createSubqueryUltimoPrecioCostoProducto } from "@/db/subquerys";

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

    return {
      data: {
        saldoInventarios,
        saldoCuentasEfectivoCUP,
        saldoCuentasEfectivoUSD,
        saldoCuentasBancarias,
        saldoZelle,
        saldoTotal: {
          CUP:
            saldoInventarios +
            saldoCuentasEfectivoCUP +
            saldoCuentasBancarias +
            saldoZelle,
          USD: saldoCuentasEfectivoUSD,
        },
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
