"use server";

import { revalidatePath } from "next/cache";
import { InferOutput } from "valibot";
import { VentasCafeteriaSchema } from "./schema";
import { getSession } from "@/lib/getSession";
import { db, DrizzleTransaction } from "@/db/initial";
import {
  inventarioCuentas,
  inventarioElaboraciones,
  inventarioElaboracionesIngredientesCantidad,
  inventarioElaboracionesVentasCafeteria,
  inventarioIngredienteCantidad,
  inventarioInventarioAreaCafeteria,
  inventarioProductosCafeteria,
  inventarioProductosVentasCafeteria,
  inventarioTransacciones,
  inventarioVentasCafeteria,
  inventarioVentasCafeteriaElaboraciones,
  inventarioVentasCafeteriaProductos,
} from "@/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { METODOS_PAGO } from "../../(almacen-cafeteria)/entradas-cafeteria/types";
import { CAJA_CAFETERIA } from "@/lib/utils";
import { TipoCuenta, TipoTransferencia } from "../../cuentas/types";
import { ValidationError } from "@/lib/errors";
import {
  createSubqueryUltimoPrecioElaboracion,
  createSubqueryUltimoPrecioVentaProductoCafeteria,
} from "@/db/subquerys";

export async function addVentaCafeteria(
  ventaData: InferOutput<typeof VentasCafeteriaSchema>
) {
  const session = await getSession();
  const userId = session?.user.id;
  if (!userId) return { data: null, error: "No autorizado." };

  try {
    await db.transaction(async (tx) => {
      await createVentaCafeteriaLogic(tx, ventaData, Number(userId));
    });
    revalidatePath("/cafeteria");
    return { data: "Venta agregada con éxito.", error: null };
  } catch (e) {
    console.error("Error al agregar la venta de cafetería:", e);
    if (e instanceof ValidationError) {
      return { data: null, error: e.message };
    }
    return {
      data: null,
      error: "Error al agregar la venta de cafetería.",
    };
  }
}

export async function editVentaCafeteria(
  ventaData: InferOutput<typeof VentasCafeteriaSchema>,
  ventaId: number
) {
  const session = await getSession();
  const userId = session?.user.id;
  if (!userId) return { data: null, error: "No autorizado." };

  try {
    await db.transaction(async (tx) => {
      await revertSaleStateLogic(tx, ventaId);
      await tx
        .delete(inventarioVentasCafeteria)
        .where(eq(inventarioVentasCafeteria.id, ventaId));

      await createVentaCafeteriaLogic(tx, ventaData, Number(userId));
    });

    revalidatePath("/cafeteria/ventas");
    return { data: "Venta actualizada con éxito.", error: null };
  } catch (e) {
    console.error("Error al editar la venta de cafetería:", e);
    if (e instanceof ValidationError) {
      return { data: null, error: e.message };
    }
    return {
      data: null,
      error: "Error al editar la venta de cafetería.",
    };
  }
}

export async function deleteVentaCafeteria({
  id,
}: {
  id: number;
}): Promise<{ data: string | null; error: string | null }> {
  try {
    await db.transaction(async (tx) => {
      await revertSaleStateLogic(tx, id);

      await tx
        .delete(inventarioVentasCafeteria)
        .where(eq(inventarioVentasCafeteria.id, id));
    });

    revalidatePath("/cafeteria/ventas");
    return { data: "Venta eliminada con éxito.", error: null };
  } catch (e) {
    console.error(e);
    if (e instanceof ValidationError) {
      return { data: null, error: e.message };
    }
    return { data: null, error: "Error al eliminar la venta" };
  }
}

async function createVentaCafeteriaLogic(
  tx: DrizzleTransaction,
  ventaData: InferOutput<typeof VentasCafeteriaSchema>,
  userId: number
) {
  const [venta] = await tx
    .insert(inventarioVentasCafeteria)
    .values({
      usuarioId: userId,
      metodoPago: ventaData.metodoPago,
      createdAt: new Date().toISOString(),
    })
    .returning({
      id: inventarioVentasCafeteria.id,
      createdAt: inventarioVentasCafeteria.createdAt,
    });

  const {
    totalVenta,
    totalCantidadProductos,
    totalCantidadElaboraciones,
    totalManoObra,
  } = await procesarProductos({
    productos: ventaData.productos,
    tx,
    ventaId: venta.id,
  });

  validarCuentas({
    cuentas: ventaData.cuentas,
    metodoPago: ventaData.metodoPago,
    totalVenta,
  });

  await actualizarSaldosYCrearTransacciones({
    tx,
    userId,
    ventaId: venta.id,
    cuentas: ventaData.cuentas,
    metodoPago: ventaData.metodoPago,
    totalVenta,
    totalCantidadProductos,
    totalCantidadElaboraciones,
    createdAt: venta.createdAt,
  });

  if (totalManoObra > 0) {
    await tx
      .update(inventarioCuentas)
      .set({ saldo: sql`${inventarioCuentas.saldo} - ${totalManoObra}` })
      .where(eq(inventarioCuentas.id, Number(CAJA_CAFETERIA)));

    await tx.insert(inventarioTransacciones).values({
      cuentaId: Number(CAJA_CAFETERIA),
      cantidad: totalManoObra.toString(),
      descripcion: `${totalCantidadProductos}x Prod, ${totalCantidadElaboraciones}x Elab - Cafetería`,
      tipo: TipoTransferencia.PAGO_TRABAJADOR,
      usuarioId: userId,
      ventaCafeteriaId: venta.id,
      createdAt: venta.createdAt,
    });
  }
}

async function revertSaleStateLogic(tx: DrizzleTransaction, ventaId: number) {
  const transacciones = await tx
    .select()
    .from(inventarioTransacciones)
    .where(eq(inventarioTransacciones.ventaCafeteriaId, ventaId));

  if (transacciones.length === 0) {
    throw new ValidationError("No hay transacciones para revertir.");
  }

  const cambiosEnCuentas = new Map<number, number>();

  for (const trans of transacciones) {
    const monto = parseFloat(trans.cantidad);

    let cambio = 0;
    if (trans.tipo === TipoTransferencia.VENTA) {
      cambio = -monto;
    } else if (trans.tipo === TipoTransferencia.PAGO_TRABAJADOR) {
      cambio = monto;
    } else {
      cambio = monto;
    }

    const montoActual = cambiosEnCuentas.get(trans.cuentaId) || 0;
    cambiosEnCuentas.set(trans.cuentaId, montoActual + cambio);
  }

  for (const [cuentaId, cambioTotal] of cambiosEnCuentas.entries()) {
    await tx
      .update(inventarioCuentas)
      .set({ saldo: sql`${inventarioCuentas.saldo} + ${cambioTotal}` })
      .where(eq(inventarioCuentas.id, cuentaId));
  }

  const cambiosEnInventario = new Map<number, number>();

  const productosVendidos = await tx
    .select({
      productoId: inventarioProductosVentasCafeteria.productoId,
      cantidad: inventarioProductosVentasCafeteria.cantidad,
    })
    .from(inventarioVentasCafeteriaProductos)
    .innerJoin(
      inventarioProductosVentasCafeteria,
      eq(
        inventarioVentasCafeteriaProductos.productosVentasCafeteriaId,
        inventarioProductosVentasCafeteria.id
      )
    )
    .where(eq(inventarioVentasCafeteriaProductos.ventasCafeteriaId, ventaId));

  for (const prod of productosVendidos) {
    const cantidadActual = cambiosEnInventario.get(prod.productoId) || 0;
    cambiosEnInventario.set(
      prod.productoId,
      cantidadActual + Number(prod.cantidad)
    );
  }

  const elaboracionesVendidas = await tx
    .select({
      elaboracionId: inventarioElaboracionesVentasCafeteria.productoId,
      cantidad: inventarioElaboracionesVentasCafeteria.cantidad,
    })
    .from(inventarioVentasCafeteriaElaboraciones)
    .innerJoin(
      inventarioElaboracionesVentasCafeteria,
      eq(
        inventarioVentasCafeteriaElaboraciones.elaboracionesVentasCafeteriaId,
        inventarioElaboracionesVentasCafeteria.id
      )
    )
    .where(
      eq(inventarioVentasCafeteriaElaboraciones.ventasCafeteriaId, ventaId)
    );

  if (elaboracionesVendidas.length > 0) {
    const elaboracionIds = elaboracionesVendidas.map((e) => e.elaboracionId);
    const todosLosIngredientes = await tx
      .select({
        elaboracionId:
          inventarioElaboracionesIngredientesCantidad.elaboracionesId,
        ingredienteId: inventarioIngredienteCantidad.ingredienteId,
        cantidadEnReceta: inventarioIngredienteCantidad.cantidad,
      })
      .from(inventarioElaboracionesIngredientesCantidad)
      .innerJoin(
        inventarioIngredienteCantidad,
        eq(
          inventarioElaboracionesIngredientesCantidad.ingredienteCantidadId,
          inventarioIngredienteCantidad.id
        )
      )
      .where(
        inArray(
          inventarioElaboracionesIngredientesCantidad.elaboracionesId,
          elaboracionIds
        )
      );

    for (const elab of elaboracionesVendidas) {
      const ingredientesDeLaReceta = todosLosIngredientes.filter(
        (i) => i.elaboracionId === elab.elaboracionId
      );
      for (const ingrediente of ingredientesDeLaReceta) {
        const cantidadADevolver =
          parseFloat(ingrediente.cantidadEnReceta) * elab.cantidad;
        const cantidadActual =
          cambiosEnInventario.get(ingrediente.ingredienteId) || 0;
        cambiosEnInventario.set(
          ingrediente.ingredienteId,
          cantidadActual + cantidadADevolver
        );
      }
    }
  }

  // Ejecutamos una actualización por cada producto/ingrediente afectado
  for (const [productoId, cantidadTotal] of cambiosEnInventario.entries()) {
    await tx
      .update(inventarioInventarioAreaCafeteria)
      .set({
        cantidad: sql`${inventarioInventarioAreaCafeteria.cantidad} + ${cantidadTotal}`,
      })
      .where(eq(inventarioInventarioAreaCafeteria.productoId, productoId));
  }
}

async function actualizarSaldosYCrearTransacciones({
  metodoPago,
  tx,
  userId,
  ventaId,
  cuentas,
  totalCantidadProductos,
  totalCantidadElaboraciones,
  totalVenta,
  createdAt,
}: {
  tx: DrizzleTransaction;
  ventaId: number;
  cuentas: InferOutput<typeof VentasCafeteriaSchema>["cuentas"];
  metodoPago: METODOS_PAGO;
  totalCantidadProductos: number;
  totalCantidadElaboraciones: number;
  totalVenta: number;
  userId: number;
  createdAt: string;
}) {
  const descripcion = `[${metodoPago}] ${totalCantidadProductos}x Prod, ${totalCantidadElaboraciones}x Elab - Cafetería`;

  for (const pago of cuentas) {
    const cuentaId = Number(pago.cuenta);
    if (isNaN(cuentaId)) throw new Error("ID de cuenta inválido.");

    let monto = 0;

    if (metodoPago === METODOS_PAGO.EFECTIVO) {
      monto = totalVenta;
    } else {
      if (cuentas.length === 1 && metodoPago !== METODOS_PAGO.MIXTO) {
        monto = totalVenta;
      } else {
        monto = pago.cantidad ?? 0;
      }
    }

    if (monto <= 0) continue;

    await tx
      .update(inventarioCuentas)
      .set({ saldo: sql`${inventarioCuentas.saldo} + ${monto}` })
      .where(eq(inventarioCuentas.id, cuentaId));

    await tx.insert(inventarioTransacciones).values({
      cuentaId,
      cantidad: monto.toString(),
      descripcion,
      tipo: TipoTransferencia.VENTA,
      usuarioId: userId,
      ventaCafeteriaId: ventaId,
      createdAt,
    });
  }
}

function validarCuentas({
  metodoPago,
  cuentas,
  totalVenta,
}: {
  metodoPago: METODOS_PAGO;
  cuentas: InferOutput<typeof VentasCafeteriaSchema>["cuentas"];
  totalVenta: number;
}): void {
  const cuentasIds = cuentas.map((p) => p.cuenta);
  if (new Set(cuentasIds).size !== cuentasIds.length) {
    throw new ValidationError("No pueden haber cuentas duplicadas en el pago.");
  }

  let totalPagado = 0;

  switch (metodoPago) {
    case METODOS_PAGO.EFECTIVO:
      if (cuentas.length !== 1) {
        throw new ValidationError(
          "Para pago en efectivo, se espera exactamente una cuenta."
        );
      }
      if (Number(cuentas[0].cuenta) !== Number(CAJA_CAFETERIA)) {
        throw new ValidationError(
          "La cuenta para pago en efectivo debe ser la caja de la cafetería."
        );
      }
      totalPagado = totalVenta;
      break;

    case METODOS_PAGO.TRANSFERENCIA:
      if (cuentas.length < 1) {
        throw new ValidationError(
          "Para pago por transferencia, se requiere al menos una cuenta."
        );
      }
      if (cuentas.some((c) => c.tipo !== TipoCuenta.BANCARIA)) {
        throw new ValidationError(
          "Todas las cuentas para transferencia deben ser de tipo 'BANCARIA'."
        );
      }

      if (cuentas.length > 1) {
        if (cuentas.some((c) => !c.cantidad || c.cantidad <= 0)) {
          throw new ValidationError(
            "Si se usan varias cuentas para transferencia, cada una debe tener un monto especificado."
          );
        }
        totalPagado = cuentas.reduce((acc, c) => acc + (c.cantidad ?? 0), 0);
      } else {
        totalPagado = cuentas[0].cantidad ?? totalVenta;
      }
      break;

    case METODOS_PAGO.MIXTO:
      const cuentaEfectivo = cuentas.filter(
        (c) => c.tipo === TipoCuenta.EFECTIVO
      );
      const cuentasBancarias = cuentas.filter(
        (c) => c.tipo === TipoCuenta.BANCARIA
      );

      if (
        cuentaEfectivo.length !== 1 ||
        Number(cuentaEfectivo[0].cuenta) !== Number(CAJA_CAFETERIA)
      ) {
        throw new ValidationError(
          "El pago mixto debe incluir exactamente una cuenta de efectivo (la caja de la cafetería)."
        );
      }
      if (cuentasBancarias.length < 1) {
        throw new ValidationError(
          "El pago mixto debe incluir al menos una cuenta bancaria."
        );
      }
      if (cuentas.some((c) => !c.cantidad || c.cantidad <= 0)) {
        throw new ValidationError(
          "En pagos mixtos, todas las cuentas deben tener un monto especificado."
        );
      }
      totalPagado = cuentas.reduce((acc, c) => acc + (c.cantidad ?? 0), 0);
      break;

    default:
      throw new ValidationError("Método de pago no válido.");
  }

  if (Math.abs(totalPagado - totalVenta) > 0.01) {
    throw new ValidationError(
      `El total pagado (${totalPagado.toFixed(
        2
      )}) no coincide con el total de la venta (${totalVenta.toFixed(2)}).`
    );
  }
}

async function procesarProductos({
  productos,
  tx,
  ventaId,
}: {
  productos: InferOutput<typeof VentasCafeteriaSchema>["productos"];
  tx: DrizzleTransaction;
  ventaId: number;
}): Promise<{
  totalVenta: number;
  totalManoObra: number;
  totalCantidadProductos: number;
  totalCantidadElaboraciones: number;
}> {
  let totalVenta = 0;
  let totalManoObra = 0;
  let totalCantidadProductos = 0;
  let totalCantidadElaboraciones = 0;

  for (const item of productos) {
    const productoId = Number(item.producto);
    const cantidad = Number(item.cantidad);

    if (isNaN(productoId) || isNaN(cantidad) || cantidad <= 0) {
      throw new Error("Producto o cantidad inválida en la solicitud.");
    }

    if (item.isElaboracion) {
      const subqueryUltimoPrecioElaboracion =
        createSubqueryUltimoPrecioElaboracion(productoId);

      const [elaboracionData] = await tx
        .select({
          id: inventarioElaboraciones.id,
          nombre: inventarioElaboraciones.nombre,
          manoObra: inventarioElaboraciones.manoObra,
          precio: subqueryUltimoPrecioElaboracion.precio,
        })
        .from(inventarioElaboraciones)
        .where(eq(inventarioElaboraciones.id, productoId))
        .innerJoinLateral(subqueryUltimoPrecioElaboracion, sql`true`)
        .limit(1);

      if (!elaboracionData)
        throw new Error(`Elaboración con ID ${productoId} no encontrada.`);

      totalVenta += parseFloat(elaboracionData.precio) * cantidad;
      totalManoObra += parseFloat(elaboracionData.manoObra) * cantidad;
      totalCantidadElaboraciones += cantidad;

      const [elabVenta] = await tx
        .insert(inventarioElaboracionesVentasCafeteria)
        .values({ productoId, cantidad })
        .returning({ id: inventarioElaboracionesVentasCafeteria.id });

      await tx.insert(inventarioVentasCafeteriaElaboraciones).values({
        ventasCafeteriaId: ventaId,
        elaboracionesVentasCafeteriaId: elabVenta.id,
      });

      const ingredientes = await tx
        .select({
          ingredienteId: inventarioIngredienteCantidad.ingredienteId,
          ingredienteNombre: inventarioProductosCafeteria.nombre,
          cantidadEnReceta: inventarioIngredienteCantidad.cantidad,
        })
        .from(inventarioElaboracionesIngredientesCantidad)

        .innerJoin(
          inventarioIngredienteCantidad,
          eq(
            inventarioElaboracionesIngredientesCantidad.ingredienteCantidadId,
            inventarioIngredienteCantidad.id
          )
        )
        .innerJoin(
          inventarioProductosCafeteria,
          eq(
            inventarioIngredienteCantidad.ingredienteId,
            inventarioProductosCafeteria.id
          )
        )
        .where(
          eq(
            inventarioElaboracionesIngredientesCantidad.elaboracionesId,
            productoId
          )
        );

      for (const ingrediente of ingredientes) {
        const cantidadADescontar =
          parseFloat(ingrediente.cantidadEnReceta) * cantidad;

        const [stockIngrediente] = await tx
          .select({ cantidad: inventarioInventarioAreaCafeteria.cantidad })
          .from(inventarioInventarioAreaCafeteria)
          .where(
            eq(
              inventarioInventarioAreaCafeteria.productoId,
              ingrediente.ingredienteId
            )
          );

        if (
          !stockIngrediente ||
          parseFloat(stockIngrediente.cantidad) < cantidadADescontar
        ) {
          throw new ValidationError(
            `Inventario insuficiente de ${ingrediente.ingredienteNombre} de la elaboración '${elaboracionData.nombre}' en el área de cafetería.`
          );
        }

        await tx
          .update(inventarioInventarioAreaCafeteria)
          .set({
            cantidad: sql`${inventarioInventarioAreaCafeteria.cantidad} - ${cantidadADescontar}`,
          })
          .where(
            eq(
              inventarioInventarioAreaCafeteria.productoId,
              ingrediente.ingredienteId
            )
          );
      }
    } else {
      const subqueryUltimoPrecioVentaProductoCafeteria =
        createSubqueryUltimoPrecioVentaProductoCafeteria(productoId);

      const [productoData] = await tx
        .select({
          id: inventarioProductosCafeteria.id,
          nombre: inventarioProductosCafeteria.nombre,
          precio: subqueryUltimoPrecioVentaProductoCafeteria.precio,
        })
        .from(inventarioProductosCafeteria)
        .where(eq(inventarioProductosCafeteria.id, productoId))
        .innerJoinLateral(subqueryUltimoPrecioVentaProductoCafeteria, sql`true`)
        .limit(1);

      if (!productoData)
        throw new Error(`Producto con ID ${productoId} no encontrado.`);

      totalVenta += parseFloat(productoData.precio) * cantidad;
      totalCantidadProductos += cantidad;

      const [prodVenta] = await tx
        .insert(inventarioProductosVentasCafeteria)
        .values({ productoId, cantidad: cantidad.toString() })
        .returning({ id: inventarioProductosVentasCafeteria.id });

      await tx.insert(inventarioVentasCafeteriaProductos).values({
        ventasCafeteriaId: ventaId,
        productosVentasCafeteriaId: prodVenta.id,
      });

      await tx
        .update(inventarioInventarioAreaCafeteria)
        .set({
          cantidad: sql`${inventarioInventarioAreaCafeteria.cantidad} - ${cantidad}`,
        })
        .where(eq(inventarioInventarioAreaCafeteria.productoId, productoId));
    }
  }

  return {
    totalVenta,
    totalCantidadProductos,
    totalCantidadElaboraciones,
    totalManoObra,
  };
}
