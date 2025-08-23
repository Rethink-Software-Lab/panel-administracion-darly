import { ResponseTarjetas, TipoTransferencia } from "./types";
import { db } from "@/db/initial";
import {
  inventarioCuentas,
  inventarioTransacciones,
  inventarioUser,
} from "@/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export async function GetTarjetas(): Promise<{
  data: ResponseTarjetas | null;
  error: string | null;
}> {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    inicioMes.setHours(0, 0, 0, 0);

    const [cuentas, transacciones] = await Promise.all([
      await db
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
        .groupBy(inventarioCuentas.id),
      await db
        .select({
          id: inventarioTransacciones.id,
          cuenta: inventarioCuentas.nombre,
          tipo: inventarioTransacciones.tipo,
          usuario: inventarioUser.username,
          createdAt: inventarioTransacciones.createdAt,
          cantidad: inventarioTransacciones.cantidad,
          descripcion: inventarioTransacciones.descripcion,
          canDelete: sql<boolean>` CASE 
        WHEN ${inventarioTransacciones.ventaId} IS NULL AND ${inventarioTransacciones.ventaCafeteriaId} IS NULL 
        THEN TRUE 
        ELSE FALSE 
        END
        `,
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
        .limit(100),
    ]);

    return {
      error: null,
      data: {
        tarjetas: cuentas,
        total_balance: cuentas.reduce(
          (acum, cuenta) => acum + Number(cuenta.saldo),
          0
        ),
        transferencias: transacciones,
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
