import { db } from "@/db/initial";
import { inventarioCuentas, inventarioTransacciones } from "@/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  Banco,
  Moneda,
  TipoCuenta,
  TipoTransferencia,
} from "../transacciones/types";

export async function getCuentas() {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    inicioMes.setHours(0, 0, 0, 0);

    const cuentas = await db
      .select({
        id: inventarioCuentas.id,
        nombre: inventarioCuentas.nombre,
        tipo: sql<TipoCuenta>`${inventarioCuentas.tipo}`,
        banco: sql<Banco | null>`${inventarioCuentas.banco}`,
        saldo: inventarioCuentas.saldo,
        moneda: sql<Moneda>`${inventarioCuentas.moneda}`,
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
      .orderBy(desc(inventarioCuentas.saldo))
      .groupBy(inventarioCuentas.id);

    return {
      error: null,
      data: cuentas,
    };
  } catch (e) {
    console.error(e);
    return {
      data: [],
      error: "Error al obtener las cuentas.",
    };
  }
}
