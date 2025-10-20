"use server";

import { db } from "@/db/initial";
import {
  inventarioCuentas,
  inventarioGastos,
  inventarioTransacciones,
} from "@/db/schema";
import { ValidationError } from "@/lib/errors";
import { getSession } from "@/lib/getSession";
import { revalidatePath } from "next/cache";
import { InferOutput } from "valibot";
import { GastosSchema } from "./schema";
import { and, eq } from "drizzle-orm";
import { TiposGastos } from "./types";
import { TipoTransferencia } from "../cuentas/types";

export async function addGasto(
  gasto: InferOutput<typeof GastosSchema>
): Promise<{ data: string | null; error: string | null }> {
  const { userId } = await getSession();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(inventarioGastos).values({
        ...gasto,
        diaSemana: Number(gasto.diaSemana) || undefined,
        isCafeteria: gasto.area_venta === "cafeteria",
        createdAt: new Date().toISOString(),
        cuentaId: Number(gasto.cuenta),
        areaVentaId:
          gasto.area_venta === "cafeteria"
            ? undefined
            : Number(gasto.area_venta),
        usuarioId: Number(userId),
      });

      if (gasto.tipo === TiposGastos.VARIABLE) {
        const [cuenta] = await tx
          .select({ id: inventarioCuentas.id, saldo: inventarioCuentas.saldo })
          .from(inventarioCuentas)
          .where(eq(inventarioCuentas.id, Number(gasto.cuenta)))
          .limit(1);

        if (!cuenta) {
          throw new ValidationError("La cuenta no fue encontrada.");
        }

        if (parseFloat(cuenta.saldo) < gasto.cantidad) {
          throw new ValidationError("La cuenta no tiene saldo suficiente.");
        }

        const nuevoSaldo = parseFloat(cuenta.saldo) - gasto.cantidad;
        await tx
          .update(inventarioCuentas)
          .set({
            saldo: nuevoSaldo.toString(),
          })
          .where(eq(inventarioCuentas.id, cuenta.id));

        await tx.insert(inventarioTransacciones).values({
          cuentaId: cuenta.id,
          tipo: TipoTransferencia.EGRESO,
          cantidad: gasto.cantidad.toString(),
          createdAt: new Date().toISOString(),
          descripcion: `[Gasto variable] ${gasto.descripcion}`,
          usuarioId: Number(userId),
        });
      }
    });
    revalidatePath("/gastos");
    return {
      data: "Gasto agregado con éxito.",
      error: null,
    };
  } catch (e) {
    console.error(e);
    if (e instanceof ValidationError) {
      return {
        data: null,
        error: e.message,
      };
    }
    return {
      data: null,
      error: "Error al agregar el gasto.",
    };
  }
}

export async function editGasto(
  id: number,
  gasto: InferOutput<typeof GastosSchema>
): Promise<{ data: string | null; error: string | null }> {
  const { userId } = await getSession();
  try {
    const gastoEditado = await db
      .update(inventarioGastos)
      .set({
        ...gasto,
        diaSemana: Number(gasto.diaSemana) || undefined,
        isCafeteria: gasto.area_venta === "cafeteria",
        cuentaId: Number(gasto.cuenta),
        areaVentaId:
          gasto.area_venta === "cafeteria"
            ? undefined
            : Number(gasto.area_venta),
        usuarioId: Number(userId),
      })
      .where(
        and(
          eq(inventarioGastos.id, id),
          eq(inventarioGastos.tipo, TiposGastos.FIJO)
        )
      )
      .returning({ id: inventarioGastos.id });

    if (gastoEditado.length === 0)
      throw new ValidationError("El Gasto no fue encontrado.");

    revalidatePath("/gastos");
    return {
      data: "Gasto editado con éxito.",
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al editar el gasto.",
    };
  }
}

export async function deleteGasto({
  id,
}: {
  id: number;
}): Promise<{ data: string | null; error: string | null }> {
  try {
    await db.transaction(async (tx) => {
      const [gasto] = await tx
        .select({
          id: inventarioGastos.id,
          cuentaId: inventarioGastos.cuentaId,
          tipo: inventarioGastos.tipo,
          cantidad: inventarioGastos.cantidad,
        })
        .from(inventarioGastos)
        .where(eq(inventarioGastos.id, id))
        .limit(1);

      if (!gasto) {
        throw new ValidationError("El Gasto no fue encontrado.");
      }

      await tx
        .delete(inventarioGastos)
        .where(eq(inventarioGastos.id, gasto.id));

      if (gasto.tipo === TiposGastos.VARIABLE && gasto.cuentaId) {
        const [cuenta] = await tx
          .select({ id: inventarioCuentas.id, saldo: inventarioCuentas.saldo })
          .from(inventarioCuentas)
          .where(eq(inventarioCuentas.id, gasto.cuentaId))
          .limit(1);

        if (!cuenta) {
          throw new ValidationError("La cuenta no fue encontrada.");
        }

        const nuevoSaldo = parseFloat(cuenta.saldo) + gasto.cantidad;
        await tx
          .update(inventarioCuentas)
          .set({
            saldo: nuevoSaldo.toString(),
          })
          .where(eq(inventarioCuentas.id, cuenta.id));

        await tx
          .delete(inventarioTransacciones)
          .where(eq(inventarioTransacciones.gastoId, gasto.id));
      }
    });

    revalidatePath("/gastos");
    return {
      data: "Gasto eliminado con éxito.",
      error: null,
    };
  } catch (e) {
    console.error(e);
    if (e instanceof ValidationError) {
      return {
        data: null,
        error: e.message,
      };
    }
    return {
      data: null,
      error: "Error al eliminar el gasto.",
    };
  }
}
