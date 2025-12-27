"use server";

import { revalidatePath } from "next/cache";
import { InferOutput } from "valibot";
import { EntradaCafeteriaSchema } from "./schema";
import { db, DrizzleTransaction } from "@/db/initial";
import {
  inventarioCuentas,
  inventarioEntradasCafeteria,
  inventarioEntradasCafeteriaProductos,
  inventarioHistorialpreciocostocafeteria,
  inventarioHistorialprecioventacafeteria,
  inventarioInventarioAlmacenCafeteria,
  inventarioProductosCafeteria,
  inventarioProductosEntradasCafeteria,
  inventarioTransacciones,
} from "@/db/schema";
import {
  createSubqueryUltimoPrecioCostoProductoCafeteria,
  createSubqueryUltimoPrecioVentaProductoCafeteria,
} from "@/db/subquerys";
import { eq, inArray, sql } from "drizzle-orm";
import { getSession } from "@/lib/getSession";
import { METODOS_PAGO } from "./types";
import { ValidationError } from "@/lib/errors";
import {
  TipoCuenta,
  TipoTransferencia,
} from "../../finanzas/transacciones/types";

export async function addEntradaCafeteria(
  entrada: InferOutput<typeof EntradaCafeteriaSchema>
): Promise<{ data: string | null; error: string | null }> {
  const session = await getSession();
  const userId = session?.user.id;
  try {
    await db.transaction(async (tx) => {
      const [entradaInsertada] = await tx
        .insert(inventarioEntradasCafeteria)
        .values({
          ...entrada,
          proveedorId: Number(entrada.proveedor),
          proveedorNombre: entrada.proveedor_nombre,
          proveedorNit: entrada.proveedor_nit,
          proveedorDireccion: entrada.proveedor_direccion,
          proveedorTelefono: entrada.proveedor_telefono,
          proveedorNoCuentaCup: entrada.proveedor_no_cuenta_cup,
          proveedorNoCuentaMayorista: entrada.proveedor_no_cuenta_mayorista,
          usuarioId: Number(userId),
          createdAt: new Date().toISOString(),
        })
        .returning({ id: inventarioEntradasCafeteria.id });

      const { totalCosto, totalCantidadProductos } = await procesarProductos({
        productos: entrada.productos,
        tx,
        entradaId: entradaInsertada.id,
        userId: Number(userId),
      });

      validarCuentas({
        cuentas: entrada.cuentas,
        metodoPago: entrada.metodoPago,
        totalCosto,
      });

      await actualizarSaldosYCrearTransacciones({
        tx,
        userId: Number(userId),
        entradaId: entradaInsertada.id,
        cuentas: entrada.cuentas,
        totalCantidadProductos,
        totalCosto,
      });
    });

    revalidatePath("/almacen-cafeteria/entradas-cafeteria");
    return {
      data: "Entrada agregada con éxito.",
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
      error: "Error al agregar la entrada.",
    };
  }
}

async function procesarProductos({
  productos,
  tx,
  entradaId,
  userId,
}: {
  productos: InferOutput<typeof EntradaCafeteriaSchema>["productos"];
  tx: DrizzleTransaction;
  entradaId: number;
  userId: number;
}): Promise<{
  totalCosto: number;
  totalCantidadProductos: number;
}> {
  let totalCosto = 0;
  let totalCantidadProductos = 0;

  for (const item of productos) {
    const productoId = Number(item.producto);
    const cantidad = Number(item.cantidad);

    if (isNaN(productoId) || isNaN(cantidad) || cantidad <= 0) {
      throw new Error("Producto o cantidad inválida en la solicitud.");
    }

    const subqueryUltimoPrecioCostoProductoCafeteria =
      createSubqueryUltimoPrecioCostoProductoCafeteria(productoId);
    const subqueryUltimoPrecioVentaProductoCafeteria =
      createSubqueryUltimoPrecioVentaProductoCafeteria(productoId);

    const [productoData] = await tx
      .select({
        id: inventarioProductosCafeteria.id,
        nombre: inventarioProductosCafeteria.nombre,
        precioCosto: subqueryUltimoPrecioCostoProductoCafeteria.precio,
        precioVenta: subqueryUltimoPrecioVentaProductoCafeteria.precio,
      })
      .from(inventarioProductosCafeteria)
      .where(eq(inventarioProductosCafeteria.id, productoId))
      .innerJoinLateral(subqueryUltimoPrecioCostoProductoCafeteria, sql`true`)
      .innerJoinLateral(subqueryUltimoPrecioVentaProductoCafeteria, sql`true`)
      .limit(1);

    if (!productoData)
      throw new Error(`Producto con ID ${productoId} no encontrado.`);

    const precio_costo = item.importe / item.cantidad;

    if (parseFloat(productoData.precioCosto) !== precio_costo)
      await tx.insert(inventarioHistorialpreciocostocafeteria).values({
        productoId,
        precio: precio_costo.toString(),
        fechaInicio: new Date().toISOString(),
        usuarioId: userId,
      });
    if (
      item.precio_venta &&
      parseFloat(productoData.precioVenta) !== item.precio_venta
    )
      await tx.insert(inventarioHistorialprecioventacafeteria).values({
        productoId,
        precio: item.precio_venta.toString(),
        fechaInicio: new Date().toISOString(),
        usuarioId: userId,
      });

    totalCosto +=
      parseFloat(productoData.precioCosto) !== precio_costo
        ? precio_costo * cantidad
        : parseFloat(productoData.precioCosto) * cantidad;
    totalCantidadProductos += cantidad;

    const [prodEntradaCaf] = await tx
      .insert(inventarioProductosEntradasCafeteria)
      .values({
        productoId,
        cantidad: cantidad.toString(),
      })
      .returning({ id: inventarioProductosEntradasCafeteria.id });

    await tx.insert(inventarioEntradasCafeteriaProductos).values({
      entradasCafeteriaId: entradaId,
      productosEntradasCafeteriaId: prodEntradaCaf.id,
    });

    await tx
      .update(inventarioInventarioAlmacenCafeteria)
      .set({
        cantidad: sql`${inventarioInventarioAlmacenCafeteria.cantidad} + ${cantidad}`,
      })
      .where(eq(inventarioInventarioAlmacenCafeteria.productoId, productoId));
  }

  return {
    totalCosto,
    totalCantidadProductos,
  };
}

function validarCuentas({
  metodoPago,
  cuentas,
  totalCosto,
}: {
  metodoPago: METODOS_PAGO;
  cuentas: InferOutput<typeof EntradaCafeteriaSchema>["cuentas"];
  totalCosto: number;
}): void {
  const cuentasIds = cuentas.map((p) => p.cuenta);
  if (new Set(cuentasIds).size !== cuentasIds.length) {
    throw new ValidationError("No pueden haber cuentas duplicadas en el pago.");
  }

  let totalPagado = 0;

  switch (metodoPago) {
    case METODOS_PAGO.EFECTIVO:
      if (cuentas.length < 1) {
        throw new ValidationError(
          "Para pago en efectivo, se requiere al menos una cuenta."
        );
      }
      if (cuentas.some((c) => c.tipo !== TipoCuenta.EFECTIVO)) {
        throw new ValidationError(
          "Todas las cuentas para pago en efectivo deben ser de tipo 'EFECTIVO'."
        );
      }
      if (cuentas.length > 1) {
        if (cuentas.some((c) => !c.cantidad || c.cantidad <= 0)) {
          throw new ValidationError(
            "Si se usan varias cuentas para efectivo, cada una debe tener un monto especificado."
          );
        }
        totalPagado = cuentas.reduce((acc, c) => acc + (c.cantidad ?? 0), 0);
      } else {
        totalPagado = cuentas[0].cantidad ?? totalCosto;
      }
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
        totalPagado = cuentas[0].cantidad ?? totalCosto;
      }
      break;

    case METODOS_PAGO.MIXTO:
      const cuentasEfectivo = cuentas.filter(
        (c) => c.tipo === TipoCuenta.EFECTIVO
      );
      const cuentasBancarias = cuentas.filter(
        (c) => c.tipo === TipoCuenta.BANCARIA
      );

      if (cuentasEfectivo.length < 1) {
        throw new ValidationError(
          "El pago mixto debe incluir al menos una cuenta de efectivo."
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
      totalPagado =
        cuentasEfectivo.reduce((acc, c) => acc + (c.cantidad ?? 0), 0) +
        cuentasBancarias.reduce((acc, c) => acc + (c.cantidad ?? 0), 0);
      break;

    default:
      throw new ValidationError("Método de pago no válido.");
  }

  if (Math.abs(totalPagado - totalCosto) > 0.01) {
    throw new ValidationError(
      `El total pagado (${totalPagado.toFixed(
        2
      )}) no coincide con el total de la venta (${totalCosto.toFixed(2)}).`
    );
  }
}

async function actualizarSaldosYCrearTransacciones({
  tx,
  userId,
  entradaId,
  cuentas,
  totalCantidadProductos,
  totalCosto,
}: {
  tx: DrizzleTransaction;
  entradaId: number;
  cuentas: InferOutput<typeof EntradaCafeteriaSchema>["cuentas"];
  totalCantidadProductos: number;
  totalCosto: number;
  userId: number;
}) {
  const descripcion = `${totalCantidadProductos}x Prod - Almacén Cafetería`;

  for (const pago of cuentas) {
    const cuentaId = Number(pago.cuenta);
    if (isNaN(cuentaId)) throw new Error("ID de cuenta inválido.");

    const monto = pago.cantidad ?? totalCosto;
    if (monto <= 0) continue;

    const [cuentaDb] = await tx
      .select({
        id: inventarioCuentas.id,
        nombre: inventarioCuentas.nombre,
        saldo: inventarioCuentas.saldo,
      })
      .from(inventarioCuentas)
      .where(eq(inventarioCuentas.id, cuentaId))
      .limit(1);
    if (!cuentaDb)
      throw new Error(`La cuenta con ID ${cuentaId} no fue encontrada.`);

    if (parseFloat(cuentaDb.saldo) < monto)
      throw new ValidationError(
        `El saldo de la cuenta ${cuentaDb.nombre} no es suficiente para realizar la transacción.`
      );

    await tx.insert(inventarioTransacciones).values({
      cuentaId: cuentaDb.id,
      cantidad: monto.toString(),
      descripcion,
      tipo: TipoTransferencia.ENTRADA,
      usuarioId: userId,
      entradaCafeteriaId: entradaId,
      createdAt: new Date().toISOString(),
    });

    const nuevoSaldo = parseFloat(cuentaDb.saldo) - monto;
    await tx
      .update(inventarioCuentas)
      .set({ saldo: nuevoSaldo.toString() })
      .where(eq(inventarioCuentas.id, cuentaDb.id));
  }
}

export async function deleteEntradaCafeteria(id: number) {
  try {
    await db.transaction(async (tx) => {
      const [entrada] = await tx
        .select({
          id: inventarioEntradasCafeteria.id,
        })
        .from(inventarioEntradasCafeteria)
        .where(eq(inventarioEntradasCafeteria.id, id))
        .limit(1);

      if (!entrada) {
        throw new ValidationError("Entrada no encontrada.");
      }

      const transacciones = await tx
        .select({
          id: inventarioTransacciones.id,
          cuentaId: inventarioTransacciones.cuentaId,
          cantidad: inventarioTransacciones.cantidad,
        })
        .from(inventarioTransacciones)
        .where(eq(inventarioTransacciones.entradaCafeteriaId, entrada.id));

      if (transacciones.length === 0) {
        throw new ValidationError("Transacciones no encontradas.");
      }

      const productosConInventario = await tx
        .select({
          productoEntradaId: inventarioProductosEntradasCafeteria.id,
          productoId: inventarioProductosEntradasCafeteria.productoId,
          cantidadEntrada: inventarioProductosEntradasCafeteria.cantidad,
          cantidadInventario: inventarioInventarioAlmacenCafeteria.cantidad,
        })
        .from(inventarioProductosEntradasCafeteria)
        .innerJoin(
          inventarioEntradasCafeteriaProductos,
          eq(
            inventarioEntradasCafeteriaProductos.productosEntradasCafeteriaId,
            inventarioProductosEntradasCafeteria.id
          )
        )
        .innerJoin(
          inventarioInventarioAlmacenCafeteria,
          eq(
            inventarioInventarioAlmacenCafeteria.productoId,
            inventarioProductosEntradasCafeteria.productoId
          )
        )
        .where(
          eq(
            inventarioEntradasCafeteriaProductos.entradasCafeteriaId,
            entrada.id
          )
        );

      if (productosConInventario.length === 0) {
        throw new ValidationError("Productos no encontrados.");
      }

      const productosSinStock = productosConInventario.filter(
        (producto) =>
          parseFloat(producto.cantidadInventario) <
          parseFloat(producto.cantidadEntrada)
      );

      if (productosSinStock.length > 0) {
        throw new ValidationError(
          "Algunos productos no tienen suficiente stock para eliminar la entrada."
        );
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

      if (cuentasConSaldo.length !== transacciones.length) {
        throw new ValidationError("Alguna cuenta no fue encontrada.");
      }

      const cuentasMap = new Map(
        cuentasConSaldo.map((cuenta) => [cuenta.id, parseFloat(cuenta.saldo)])
      );

      for (const transaccion of transacciones) {
        const saldoActual = cuentasMap.get(transaccion.cuentaId) || 0;
        const nuevoSaldo = saldoActual + parseFloat(transaccion.cantidad);

        if (nuevoSaldo < 0) {
          throw new ValidationError("Saldo corrupto.");
        }

        cuentasMap.set(transaccion.cuentaId, nuevoSaldo);
      }

      const productosUnicos = new Map();
      productosConInventario.forEach((producto) => {
        if (!productosUnicos.has(producto.productoId)) {
          productosUnicos.set(producto.productoId, {
            cantidadTotal: parseFloat(producto.cantidadEntrada),
            cantidadInventario: parseFloat(producto.cantidadInventario),
          });
        } else {
          productosUnicos.get(producto.productoId).cantidadTotal += parseFloat(
            producto.cantidadEntrada
          );
        }
      });

      for (const [productoId, datos] of productosUnicos) {
        await tx
          .update(inventarioInventarioAlmacenCafeteria)
          .set({
            cantidad: sql`${inventarioInventarioAlmacenCafeteria.cantidad} - ${datos.cantidadTotal}`,
          })
          .where(
            eq(inventarioInventarioAlmacenCafeteria.productoId, productoId)
          );
      }

      for (const [cuentaId, nuevoSaldo] of cuentasMap) {
        await tx
          .update(inventarioCuentas)
          .set({ saldo: nuevoSaldo.toString() })
          .where(eq(inventarioCuentas.id, cuentaId));
      }

      await tx.delete(inventarioTransacciones).where(
        inArray(
          inventarioTransacciones.id,
          transacciones.map((t) => t.id)
        )
      );

      await tx
        .delete(inventarioEntradasCafeteriaProductos)
        .where(
          eq(
            inventarioEntradasCafeteriaProductos.entradasCafeteriaId,
            entrada.id
          )
        );

      await tx.delete(inventarioProductosEntradasCafeteria).where(
        inArray(
          inventarioProductosEntradasCafeteria.id,
          productosConInventario.map((p) => p.productoEntradaId)
        )
      );

      await tx
        .delete(inventarioEntradasCafeteria)
        .where(eq(inventarioEntradasCafeteria.id, entrada.id));
    });

    revalidatePath("/almacen-cafeteria/entradas-cafeteria");

    return {
      data: "Entrada eliminada con éxito.",
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
      error: "Error al eliminar la entrada.",
    };
  }
}
