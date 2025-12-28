"use server";
import { InferOutput } from "valibot";
import { CuentasSchema } from "./schema";
import { inventarioCuentas } from "@/db/schema";
import { db } from "@/db/initial";
import { Moneda, TipoCuenta } from "../transacciones/types";
import { revalidatePath } from "next/cache";
import { ValidationError } from "@/lib/errors";
import { eq } from "drizzle-orm";

export async function addCuenta(
  data: InferOutput<typeof CuentasSchema>
): Promise<{ data: string | null; error: string | null }> {
  try {
    await db.insert(inventarioCuentas).values({
      nombre: data.nombre,
      tipo: data.tipo,
      saldo: data.saldo_inicial.toString(),
      banco: data.banco,
      moneda: data.tipo === TipoCuenta.ZELLE ? Moneda.CUP : data.moneda,
    });
    revalidatePath("/cuentas");
    return {
      error: null,
      data: "Tarjeta agregada con éxito.",
    };
  } catch (e) {
    console.error(e);
    return { data: null, error: "Error al agregar la tarjeta." };
  }
}

export async function deleteCuenta(id: number) {
  try {
    const cuentaEliminada = await db
      .update(inventarioCuentas)
      .set({ active: false })
      .where(eq(inventarioCuentas.id, id))
      .returning({
        id: inventarioCuentas.id,
      });

    if (cuentaEliminada.length === 0)
      throw new ValidationError("Cuenta no encontrada");

    revalidatePath("/cuentas");
    return {
      data: "Cuenta eliminada con éxito.",
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
      error: "Error al eliminar la cuenta.",
    };
  }
}
