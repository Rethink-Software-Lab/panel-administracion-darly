import { TipoTransferencia } from "@/app/(with-layout)/cuentas/types";
import {
  FrecuenciasGastos,
  TiposGastos,
} from "@/app/(with-layout)/gastos/types";
import { db } from "@/db/initial";
import {
  inventarioCuentas,
  inventarioGastos,
  inventarioTransacciones,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  try {
    const gastosFijos = await db
      .select({
        id: inventarioGastos.id,
        cantidad: inventarioGastos.cantidad,
        frecuencia: inventarioGastos.frecuencia,
        diaMes: inventarioGastos.diaMes,
        diaSemana: inventarioGastos.diaSemana,
        cuentaId: inventarioGastos.cuentaId,
        descripcion: inventarioGastos.descripcion,
      })
      .from(inventarioGastos)
      .where(eq(inventarioGastos.tipo, TiposGastos.FIJO));

    const hoy = new Date();
    const diaSemanaActual = hoy.getDay();
    const diaMesActual = hoy.getDate();

    for (const gasto of gastosFijos) {
      const {
        id,
        frecuencia,
        cantidad,
        cuentaId,
        descripcion,
        diaSemana,
        diaMes,
      } = gasto;

      if (!cuentaId) {
        continue;
      }

      const debeProcesarseHoy =
        (frecuencia === FrecuenciasGastos.LUNES_SABADO &&
          diaSemanaActual !== 0) ||
        (frecuencia === FrecuenciasGastos.SEMANAL &&
          diaSemana === diaSemanaActual) ||
        (frecuencia === FrecuenciasGastos.MENSUAL && diaMes === diaMesActual);

      if (debeProcesarseHoy) {
        await db.transaction(async (tx) => {
          const [cuenta] = await tx
            .select({ saldo: inventarioCuentas.saldo })
            .from(inventarioCuentas)
            .where(eq(inventarioCuentas.id, cuentaId))
            .limit(1);

          if (!cuenta) {
            throw new Error(`La cuenta con ID ${cuentaId} no fue encontrada.`);
          }

          if (parseFloat(cuenta.saldo) < cantidad) {
            throw new Error(
              `El saldo de la cuenta ${cuentaId} es insuficiente.`
            );
          }

          const nuevoSaldo = parseFloat(cuenta.saldo) - cantidad;

          await tx
            .update(inventarioCuentas)
            .set({ saldo: nuevoSaldo.toString() })
            .where(eq(inventarioCuentas.id, cuentaId));

          await tx.insert(inventarioTransacciones).values({
            cuentaId,
            tipo: TipoTransferencia.GASTO_FIJO,
            cantidad: cantidad.toString(),
            createdAt: new Date().toISOString(),
            descripcion: descripcion,
            gastoId: id,
          });
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error ejecutando el cron job de gastos fijos:", error);

    return NextResponse.json(
      { error: "Ocurrió un error en el servidor." },
      { status: 500 }
    );
  }
}
