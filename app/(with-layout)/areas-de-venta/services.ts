import { db } from "@/db/initial";
import { inventarioAreaventa, inventarioCuentas } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { TipoCuenta } from "../finanzas/types";

export async function getAreasVentas() {
  try {
    const areas = await db
      .select({
        id: inventarioAreaventa.id,
        nombre: inventarioAreaventa.nombre,
        color: inventarioAreaventa.color,
        cuenta: { id: inventarioCuentas.id, nombre: inventarioCuentas.nombre },
      })
      .from(inventarioAreaventa)
      .leftJoin(
        inventarioCuentas,
        eq(inventarioAreaventa.cuentaId, inventarioCuentas.id)
      )
      .where(eq(inventarioAreaventa.active, true))
      .orderBy(desc(inventarioAreaventa.id));

    const cuentasEfectivo = await db
      .select({
        id: inventarioCuentas.id,
        nombre: inventarioCuentas.nombre,
      })
      .from(inventarioCuentas)
      .where(eq(inventarioCuentas.tipo, TipoCuenta.EFECTIVO));

    return {
      data: {
        areas,
        cuentasEfectivo,
      },
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al obtener las áreas de venta.",
    };
  }
}
