"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies, type UnsafeUnwrappedCookies } from "next/headers";

import { InferInput, InferOutput } from "valibot";
import { Moneda, TipoCuenta, TipoTransferencia } from "./types";
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
      moneda: data.tipo === TipoCuenta.ZELLE ? Moneda.USD : data.moneda,
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

/* Esto son las transacciones [ingreso y egreso] */
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

export async function deleteTransaccion({ id }: { id: number }) {
  try {
    const [transaccion] = await db
      .select()
      .from(inventarioTransacciones)
      .where(eq(inventarioTransacciones.id, id))
      .limit(1);

    if (!transaccion) {
      throw new ValidationError("Transacción no encontrada.");
    }

    const tiposValidos: string[] = [
      TipoTransferencia.EGRESO,
      TipoTransferencia.INGRESO,
      TipoTransferencia.TRANSFERENCIA,
    ];

    if (!tiposValidos.includes(transaccion.tipo))
      throw new ValidationError(
        "La transaccion no es de un tipo valido para eliminar."
      );

    if (
      transaccion.tipo === TipoTransferencia.EGRESO ||
      transaccion.tipo === TipoTransferencia.INGRESO
    ) {
      const [cuenta] = await db
        .select()
        .from(inventarioCuentas)
        .where(eq(inventarioCuentas.id, transaccion.cuentaId))
        .limit(1);

      if (!cuenta) {
        throw new ValidationError("Cuenta no encontrada.");
      }

      if (
        transaccion.tipo === TipoTransferencia.INGRESO &&
        parseFloat(cuenta.saldo) < parseFloat(transaccion.cantidad)
      )
        throw new ValidationError(
          "Saldo insuficiente para eliminar la transaccion."
        );

      const nuevoSaldo =
        transaccion.tipo === TipoTransferencia.EGRESO
          ? parseFloat(cuenta.saldo) + parseFloat(transaccion.cantidad)
          : parseFloat(cuenta.saldo) - parseFloat(transaccion.cantidad);

      await db.transaction(async (tx) => {
        await tx
          .update(inventarioCuentas)
          .set({ saldo: nuevoSaldo.toString() })
          .where(eq(inventarioCuentas.id, cuenta.id));

        await tx
          .delete(inventarioTransacciones)
          .where(eq(inventarioTransacciones.id, id));
      });
    } else if (transaccion.tipo === TipoTransferencia.TRANSFERENCIA) {
      if (!transaccion.cuentaOrigenId || !transaccion.cuentaDestinoId)
        throw new Error(
          "La transaccion no tiene cuenta origen o cuenta destino."
        );

      const cuentasOrigenYDestino = await db
        .select()
        .from(inventarioCuentas)
        .where(
          inArray(inventarioCuentas.id, [
            transaccion.cuentaOrigenId,
            transaccion.cuentaDestinoId,
          ])
        )
        .limit(2);

      const cuentaOrigen = cuentasOrigenYDestino.find(
        (c) => transaccion.cuentaOrigenId === c.id
      );

      const cuentaDestino = cuentasOrigenYDestino.find(
        (c) => transaccion.cuentaDestinoId === c.id
      );

      if (!cuentaOrigen) {
        throw new ValidationError("Cuenta de origen no encontrada.");
      }

      if (!cuentaDestino) {
        throw new ValidationError("Cuenta de destino no encontrada.");
      }

      const sonMonedasIguales = cuentaOrigen.moneda === cuentaDestino.moneda;

      if (parseFloat(cuentaDestino.saldo) < parseFloat(transaccion.cantidad)) {
        throw new ValidationError(
          "El saldo de la cuenta destino es insuficiente para eliminar la transferencia."
        );
      }

      if (
        !sonMonedasIguales &&
        (!transaccion.tipoCambio || parseFloat(transaccion.tipoCambio) < 0)
      )
        throw new Error(
          "El tipo de cambio es requerido para transferencias entre monedas diferentes."
        );

      const nuevoSaldoOrigen = sonMonedasIguales
        ? parseFloat(cuentaOrigen.saldo) + parseFloat(transaccion.cantidad)
        : parseFloat(cuentaOrigen.saldo) +
          parseFloat(transaccion.cantidad) /
            parseFloat(transaccion.tipoCambio!);
      const nuevoSaldoDestino =
        parseFloat(cuentaDestino.saldo) - parseFloat(transaccion.cantidad);

      await db.transaction(async (tx) => {
        await tx
          .update(inventarioCuentas)
          .set({ saldo: nuevoSaldoOrigen.toString() })
          .where(eq(inventarioCuentas.id, cuentaOrigen.id));

        await tx
          .update(inventarioCuentas)
          .set({ saldo: nuevoSaldoDestino.toString() })
          .where(eq(inventarioCuentas.id, cuentaDestino.id));

        await tx
          .delete(inventarioTransacciones)
          .where(eq(inventarioTransacciones.id, id));
      });
    }

    revalidatePath("/cuentas");
    return {
      data: "Transferencia eliminada con éxito.",
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
      error: "Error al eliminar la transferencia.",
    };
  }
}

export async function addTransferencia(
  data: InferOutput<typeof TransferenciaSchema>
): Promise<{ data: string | null; error: string | null }> {
  try {
    const session = await getSession();
    const userId = session?.user.id;

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

    const sonMonedasIguales = cuentaOrigen.moneda === cuentaDestino.moneda;

    if (
      sonMonedasIguales
        ? parseFloat(cuentaOrigen.saldo) < data.cantidad
        : parseFloat(cuentaOrigen.saldo) < data.cantidad / data.tipoCambio!
    ) {
      throw new ValidationError(
        "El saldo de la cuenta de origen es insuficiente."
      );
    }

    const { cantidadOrigenARestar } = calcularDetallesTransferencia(
      data.cantidad,
      sonMonedasIguales,
      data.tipoCambio
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
        descripcion: data.descripcion,
        usuarioId: Number(userId),
        cuentaId: cuentaOrigen.id,
        cuentaOrigenId: cuentaOrigen.id,
        cuentaDestinoId: cuentaDestino.id,
        tipoCambio: data.tipoCambio?.toString(),
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
  cantidadATransferir: number,
  sonMonedasIguales: boolean,
  tipoCambio?: number
) {
  if (sonMonedasIguales) {
    return {
      cantidadOrigenARestar: cantidadATransferir,
    };
  }

  if (!tipoCambio || tipoCambio <= 0) {
    throw new ValidationError(
      "El tipo de cambio es requerido para transferencias entre monedas diferentes."
    );
  }

  return {
    cantidadOrigenARestar: cantidadATransferir / tipoCambio,
  };
}
