"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies, type UnsafeUnwrappedCookies } from "next/headers";

import { InferInput, InferOutput } from "valibot";
import { TipoTransferencia } from "./types";
import {
  CuentasSchema,
  TransferenciaSchema,
  TransferenciasTarjetas,
} from "./schema";
import { db } from "@/db/initial";
import { inventarioCuentas, inventarioTransacciones } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { ValidationError } from "@/lib/errors";
import { getSession } from "@/lib/getSession";

export async function addCuenta(
  data: InferOutput<typeof CuentasSchema>
): Promise<{ data: string | null; error: string | null }> {
  try {
    await db.insert(inventarioCuentas).values({
      nombre: data.nombre,
      tipo: data.tipo,
      saldo: data.saldo_inicial.toString(),
      banco: data.banco,
      moneda: data.moneda,
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
      .delete(inventarioCuentas)
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

export async function addTransferenciaTarjeta(
  data: InferInput<typeof TransferenciasTarjetas>
): Promise<{ data: string | null; error: string | null }> {
  const token = (cookies() as unknown as UnsafeUnwrappedCookies).get(
    "session"
  )?.value;
  const res = await fetch(
    process.env.BACKEND_URL_V2 + "/tarjetas/add/transferencia/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    if (res.status === 401)
      return {
        data: null,
        error: "No autorizado",
      };

    if (res.status === 400) {
      const json = await res.json();
      return {
        data: null,
        error: json.detail,
      };
    }

    return {
      data: null,
      error: "Algo salió mal.",
    };
  }
  revalidateTag("tarjetas");
  return {
    error: null,
    data: "Transferencia agregada con éxito.",
  };
}

export async function deleteTransferenciaTarjeta({ id }: { id: number }) {
  const token = (cookies() as unknown as UnsafeUnwrappedCookies).get(
    "session"
  )?.value;
  const res = await fetch(
    process.env.BACKEND_URL_V2 + "/tarjetas/transferencia/" + id + "/",
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) {
    if (res.status === 401)
      return {
        data: null,
        error: "No autorizado",
      };
    if (res.status === 400) {
      const json = await res.json();
      return {
        data: null,
        error: json.detail,
      };
    }
    if (res.status === 404)
      return {
        data: null,
        error: "Transferencia no encontrada",
      };
    return {
      data: null,
      error: "Algo salió mal.",
    };
  }
  revalidateTag("tarjetas");
  return {
    data: "Transferencia eliminada con éxito.",
    error: null,
  };
}

export async function addTransferencia(
  data: InferOutput<typeof TransferenciaSchema>
): Promise<{ data: string | null; error: string | null }> {
  try {
    const { userId } = await getSession();

    const cuentas = await db
      .select({
        id: inventarioCuentas.id,
        nombre: inventarioCuentas.nombre,
        saldo: inventarioCuentas.saldo,
        moneda: inventarioCuentas.moneda,
      })
      .from(inventarioCuentas)
      .where(
        inArray(inventarioCuentas.id, [data.cuentaOrigen, data.cuentaDestino])
      );

    if (cuentas.length !== 2) {
      throw new ValidationError(
        "Las cuentas de origen o destino no son válidas."
      );
    }

    const cuentaOrigen = cuentas.find((c) => c.id === data.cuentaOrigen);
    const cuentaDestino = cuentas.find((c) => c.id === data.cuentaDestino);

    if (!cuentaOrigen || !cuentaDestino) {
      throw new ValidationError(
        "No se pudieron encontrar las cuentas especificadas."
      );
    }

    if (parseFloat(cuentaOrigen.saldo) < data.cantidad) {
      throw new ValidationError(
        "El saldo de la cuenta de origen es insuficiente."
      );
    }

    const { cantidadOrigenARestar, descripcion } =
      calcularDetallesTransferencia(
        cuentaOrigen,
        cuentaDestino,
        data.cantidad,
        data.tipoCambio,
        data.descripcion
      );

    const nuevoSaldoOrigen =
      parseFloat(cuentaOrigen.saldo) - cantidadOrigenARestar;
    const nuevoSaldoDestino = parseFloat(cuentaDestino.saldo) + data.cantidad;

    await db.transaction(async (tx) => {
      await tx
        .update(inventarioCuentas)
        .set({ saldo: nuevoSaldoOrigen.toString() })
        .where(eq(inventarioCuentas.id, cuentaOrigen.id));

      await tx
        .update(inventarioCuentas)
        .set({ saldo: nuevoSaldoDestino.toString() })
        .where(eq(inventarioCuentas.id, cuentaDestino.id));

      await tx.insert(inventarioTransacciones).values({
        tipo: TipoTransferencia.TRANSFERENCIA,
        cantidad: data.cantidad.toString(),
        moneda: cuentaDestino.moneda,
        createdAt: new Date().toISOString(),
        descripcion: descripcion,
        usuarioId: Number(userId),
        cuentaId: cuentaOrigen.id,
      });
    });

    revalidatePath("/cuentas");
    return {
      error: null,
      data: "Transferencia realizada con éxito.",
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
      error: "Error al agregar la transferencia.",
    };
  }
}

function calcularDetallesTransferencia(
  origen: { nombre: string; moneda: string },
  destino: { nombre: string; moneda: string },
  cantidadATransferir: number,
  tipoCambio?: number,
  descripcion?: string
) {
  const sonMonedasIguales = origen.moneda === destino.moneda;

  if (sonMonedasIguales) {
    return {
      cantidadOrigenARestar: cantidadATransferir,
      descripcion: `${origen.nombre} -> ${destino.nombre} : ${descripcion}`,
    };
  }

  if (!tipoCambio || tipoCambio <= 0) {
    throw new ValidationError(
      "El tipo de cambio es requerido para transferencias entre monedas diferentes."
    );
  }

  return {
    cantidadOrigenARestar: cantidadATransferir / tipoCambio,
    descripcion: `${origen.nombre} -> ${destino.nombre} (T/C: ${tipoCambio}) : ${descripcion}`,
  };
}
