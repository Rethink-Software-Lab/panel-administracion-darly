"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
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
  inventarioInventarioAlmacenCafeteria,
  inventarioInventarioAreaCafeteria,
  inventarioProductosCafeteria,
  inventarioProductosVentasCafeteria,
  inventarioTransacciones,
  inventarioVentasCafeteria,
  inventarioVentasCafeteriaElaboraciones,
  inventarioVentasCafeteriaProductos,
} from "@/db/schema";
import { desc, eq, sql, inArray, and } from "drizzle-orm";
import { METODOS_PAGO } from "../(almacen-cafeteria)/entradas-cafeteria/types";
import { CAJA_CAFETERIA } from "@/lib/utils";
import { TipoCuenta, TipoTransferencia } from "../cuentas/types";
import { ValidationError } from "@/lib/errors";
import {
  createSubqueryUltimoPrecioElaboracion,
  createSubqueryUltimoPrecioVentaProductoCafeteria,
} from "@/db/subquerys";

export async function addVentaCafeteria(
  ventaData: InferOutput<typeof VentasCafeteriaSchema>
): Promise<{ data: string | null; error: string | null }> {
  const { userId } = await getSession();
  try {
    await db.transaction(async (tx) => {
      const [venta] = await tx
        .insert(inventarioVentasCafeteria)
        .values({
          usuarioId: Number(userId),
          metodoPago: ventaData.metodoPago,
          createdAt: new Date().toISOString(),
        })
        .returning({ id: inventarioVentasCafeteria.id });

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
        userId: Number(userId),
        ventaId: venta.id,
        cuentas: ventaData.cuentas,
        metodoPago: ventaData.metodoPago,
        totalVenta,
        totalCantidadProductos,
        totalCantidadElaboraciones,
      });

      if (totalManoObra > 0) {
        await tx.insert(inventarioTransacciones).values({
          cuentaId: Number(CAJA_CAFETERIA),
          cantidad: totalManoObra.toString(),
          descripcion: `[PAGO TRABAJADOR] ${totalCantidadProductos}x Prod, ${totalCantidadElaboraciones}x Elab - Cafetería`,
          tipo: TipoTransferencia.EGRESO,
          usuarioId: Number(userId),
          ventaCafeteriaId: venta.id,
          createdAt: new Date().toISOString(),
        });

        const [cajaCafeteria] = await tx
          .select()
          .from(inventarioCuentas)
          .where(eq(inventarioCuentas.id, Number(CAJA_CAFETERIA)))
          .limit(1);

        const nuevoSaldoForPago =
          parseFloat(cajaCafeteria.saldo) - totalManoObra;
        await tx
          .update(inventarioCuentas)
          .set({ saldo: nuevoSaldoForPago.toString() })
          .where(eq(inventarioCuentas.id, cajaCafeteria.id));
      }
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

async function actualizarSaldosYCrearTransacciones({
  metodoPago,
  tx,
  userId,
  ventaId,
  cuentas,
  totalCantidadProductos,
  totalCantidadElaboraciones,
  totalVenta,
}: {
  tx: DrizzleTransaction;
  ventaId: number;
  cuentas: InferOutput<typeof VentasCafeteriaSchema>["cuentas"];
  metodoPago: METODOS_PAGO;
  totalCantidadProductos: number;
  totalCantidadElaboraciones: number;
  totalVenta: number;
  userId: number;
}) {
  const descripcion = `[${metodoPago}] ${totalCantidadProductos}x Prod, ${totalCantidadElaboraciones}x Elab - Cafetería`;

  for (const pago of cuentas) {
    const cuentaId = Number(pago.cuenta);
    if (isNaN(cuentaId)) throw new Error("ID de cuenta inválido.");

    const monto = pago.cantidad ?? totalVenta;
    if (monto <= 0) continue;

    const cuentaDb = await tx.query.inventarioCuentas.findFirst({
      where: eq(inventarioCuentas.id, cuentaId),
    });
    if (!cuentaDb)
      throw new Error(`La cuenta con ID ${cuentaId} no fue encontrada.`);

    await tx.insert(inventarioTransacciones).values({
      cuentaId: cuentaId,
      cantidad: monto.toString(),
      descripcion,
      tipo: "INGRESO",
      usuarioId: userId,
      ventaCafeteriaId: ventaId,
      createdAt: new Date().toISOString(),
    });

    const nuevoSaldo = parseFloat(cuentaDb.saldo) + monto;
    await tx
      .update(inventarioCuentas)
      .set({ saldo: nuevoSaldo.toString() })
      .where(eq(inventarioCuentas.id, cuentaId));
  }
}

export async function deleteVentaCafeteria({
  id,
}: {
  id: number;
}): Promise<{ data: string | null; error: string | null }> {
  try {
    await db.transaction(async (tx) => {
      const [venta] = await tx
        .select({
          id: inventarioVentasCafeteria.id,
        })
        .from(inventarioVentasCafeteria)
        .where(eq(inventarioVentasCafeteria.id, id))
        .limit(1);

      if (!venta) {
        throw new ValidationError("Venta no encontrada.");
      }

      const transacciones = await tx
        .select({
          id: inventarioTransacciones.id,
          cuentaId: inventarioTransacciones.cuentaId,
          cantidad: inventarioTransacciones.cantidad,
          tipo: inventarioTransacciones.tipo,
        })
        .from(inventarioTransacciones)
        .where(eq(inventarioTransacciones.ventaCafeteriaId, venta.id));

      if (transacciones.length === 0) {
        throw new ValidationError("Transacciones no encontradas.");
      }

      const productosVendidos = await tx
        .select({
          productoVentaId: inventarioProductosVentasCafeteria.id,
          productoId: inventarioProductosVentasCafeteria.productoId,
          cantidadVendida: inventarioProductosVentasCafeteria.cantidad,
          cantidadInventario: inventarioInventarioAreaCafeteria.cantidad,
        })
        .from(inventarioProductosVentasCafeteria)
        .innerJoin(
          inventarioVentasCafeteriaProductos,
          eq(
            inventarioVentasCafeteriaProductos.productosVentasCafeteriaId,
            inventarioProductosVentasCafeteria.id
          )
        )
        .innerJoin(
          inventarioInventarioAreaCafeteria,
          eq(
            inventarioInventarioAreaCafeteria.productoId,
            inventarioProductosVentasCafeteria.productoId
          )
        )
        .where(
          eq(inventarioVentasCafeteriaProductos.ventasCafeteriaId, venta.id)
        );

      const elaboracionesVendidas = await tx
        .select({
          elaboracionVentaId: inventarioElaboracionesVentasCafeteria.id,
          elaboracionId: inventarioElaboracionesVentasCafeteria.productoId,
          cantidadVendida: inventarioElaboracionesVentasCafeteria.cantidad,
        })
        .from(inventarioElaboracionesVentasCafeteria)
        .innerJoin(
          inventarioVentasCafeteriaElaboraciones,
          eq(
            inventarioVentasCafeteriaElaboraciones.elaboracionesVentasCafeteriaId,
            inventarioElaboracionesVentasCafeteria.id
          )
        )
        .where(
          eq(inventarioVentasCafeteriaElaboraciones.ventasCafeteriaId, venta.id)
        );

      const ingredientesElaboraciones = [];
      for (const elaboracion of elaboracionesVendidas) {
        const ingredientes = await tx
          .select({
            ingredienteCantidadId:
              inventarioElaboracionesIngredientesCantidad.ingredienteCantidadId,
            cantidadIngrediente: inventarioIngredienteCantidad.cantidad,
            ingredienteId: inventarioIngredienteCantidad.ingredienteId,
            cantidadInventario: inventarioInventarioAreaCafeteria.cantidad,
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
            inventarioInventarioAreaCafeteria,
            eq(
              inventarioInventarioAreaCafeteria.productoId,
              inventarioIngredienteCantidad.ingredienteId
            )
          )
          .where(
            eq(
              inventarioElaboracionesIngredientesCantidad.elaboracionesId,
              elaboracion.elaboracionId
            )
          );

        ingredientesElaboraciones.push({
          elaboracionId: elaboracion.elaboracionId,
          cantidadElaboracion: elaboracion.cantidadVendida,
          ingredientes,
        });
      }

      const cuentasConSaldo = await tx
        .select({
          id: inventarioCuentas.id,
          saldo: inventarioCuentas.saldo,
        })
        .from(inventarioCuentas)
        .where(
          inArray(
            inventarioCuentas.id,
            transacciones.map((t) => t.cuentaId)
          )
        );

      const transaccionesIngreso = transacciones.filter(
        (t) => t.tipo === TipoTransferencia.INGRESO
      );
      const transaccionesEgreso = transacciones.filter(
        (t) => t.tipo === TipoTransferencia.EGRESO
      );

      const cuentasMap = new Map(
        cuentasConSaldo.map((cuenta) => [cuenta.id, parseFloat(cuenta.saldo)])
      );

      for (const transaccion of transaccionesIngreso) {
        const saldoActual = cuentasMap.get(transaccion.cuentaId) || 0;
        const nuevoSaldo = saldoActual - parseFloat(transaccion.cantidad);

        if (nuevoSaldo < 0) {
          throw new ValidationError(
            "Saldo insuficiente para revertir la transacción."
          );
        }

        cuentasMap.set(transaccion.cuentaId, nuevoSaldo);
      }

      const productosUnicos = new Map();
      productosVendidos.forEach((producto) => {
        if (!productosUnicos.has(producto.productoId)) {
          productosUnicos.set(producto.productoId, {
            cantidadTotal: parseFloat(producto.cantidadVendida || "0"),
          });
        } else {
          productosUnicos.get(producto.productoId).cantidadTotal += parseFloat(
            producto.cantidadVendida || "0"
          );
        }
      });

      for (const [productoId, datos] of productosUnicos) {
        await tx
          .update(inventarioInventarioAreaCafeteria)
          .set({
            cantidad: sql`${inventarioInventarioAreaCafeteria.cantidad} + ${datos.cantidadTotal}`,
          })
          .where(eq(inventarioInventarioAreaCafeteria.productoId, productoId));
      }

      const ingredientesUnicos = new Map();
      for (const elaboracionData of ingredientesElaboraciones) {
        for (const ingrediente of elaboracionData.ingredientes) {
          const cantidadNecesaria =
            parseFloat(ingrediente.cantidadIngrediente) *
            elaboracionData.cantidadElaboracion;

          if (!ingredientesUnicos.has(ingrediente.ingredienteId)) {
            ingredientesUnicos.set(ingrediente.ingredienteId, {
              cantidadTotal: cantidadNecesaria,
            });
          } else {
            ingredientesUnicos.get(ingrediente.ingredienteId).cantidadTotal +=
              cantidadNecesaria;
          }
        }
      }

      for (const [ingredienteId, datos] of ingredientesUnicos) {
        await tx
          .update(inventarioInventarioAreaCafeteria)
          .set({
            cantidad: sql`${inventarioInventarioAreaCafeteria.cantidad} + ${datos.cantidadTotal}`,
          })
          .where(
            eq(inventarioInventarioAreaCafeteria.productoId, ingredienteId)
          );
      }

      for (const [cuentaId, nuevoSaldo] of cuentasMap) {
        await tx
          .update(inventarioCuentas)
          .set({ saldo: nuevoSaldo.toString() })
          .where(eq(inventarioCuentas.id, cuentaId));
      }

      for (const transaccionEgreso of transaccionesEgreso) {
        const [cuenta] = await tx
          .select({
            id: inventarioCuentas.id,
            saldo: inventarioCuentas.saldo,
          })
          .from(inventarioCuentas)
          .where(eq(inventarioCuentas.id, transaccionEgreso.cuentaId))
          .limit(1);

        if (cuenta) {
          const nuevoSaldo =
            parseFloat(cuenta.saldo) + parseFloat(transaccionEgreso.cantidad);
          await tx
            .update(inventarioCuentas)
            .set({ saldo: nuevoSaldo.toString() })
            .where(eq(inventarioCuentas.id, cuenta.id));
        }
      }

      await tx.delete(inventarioTransacciones).where(
        inArray(
          inventarioTransacciones.id,
          transacciones.map((t) => t.id)
        )
      );

      await tx
        .delete(inventarioVentasCafeteriaProductos)
        .where(
          eq(inventarioVentasCafeteriaProductos.ventasCafeteriaId, venta.id)
        );

      await tx
        .delete(inventarioVentasCafeteriaElaboraciones)
        .where(
          eq(inventarioVentasCafeteriaElaboraciones.ventasCafeteriaId, venta.id)
        );

      if (productosVendidos.length > 0) {
        await tx.delete(inventarioProductosVentasCafeteria).where(
          inArray(
            inventarioProductosVentasCafeteria.id,
            productosVendidos.map((p) => p.productoVentaId)
          )
        );
      }

      if (elaboracionesVendidas.length > 0) {
        await tx.delete(inventarioElaboracionesVentasCafeteria).where(
          inArray(
            inventarioElaboracionesVentasCafeteria.id,
            elaboracionesVendidas.map((e) => e.elaboracionVentaId)
          )
        );
      }

      await tx
        .delete(inventarioVentasCafeteria)
        .where(eq(inventarioVentasCafeteria.id, venta.id));
    });

    revalidateTag("ventas-cafeteria");
    return {
      data: "Venta eliminada con éxito.",
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
      error: "Error al eliminar la venta",
    };
  }
}
