"use server";

import { VentasSchema } from "@/app/(with-layout)/areas-de-venta/[id]/schema";
import { db, DrizzleTransaction } from "@/db/initial";
import {
  inventarioAjusteinventarioProductos,
  inventarioCuentas,
  inventarioHistorialprecioventasalon,
  inventarioProducto,
  inventarioProductoinfo,
  inventarioTransacciones,
  inventarioVentas,
} from "@/db/schema";
import {
  and,
  desc,
  eq,
  inArray,
  InferSelectModel,
  isNull,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { InferInput, InferOutput } from "valibot";
import { METODOS_PAGO } from "../../(almacen-cafeteria)/entradas-cafeteria/types";
import { TipoCuenta, TipoTransferencia } from "../../cuentas/types";
import { getSession } from "@/lib/getSession";
import { AuthorizationError, ValidationError } from "@/lib/errors";
import { ResultPattern } from "@/lib/types";
import { AreaVenta } from "../types";

interface DataVenta
  extends Omit<InferInput<typeof VentasSchema>, "zapatos_id"> {
  zapatos_id?: number[];
  areaVenta: Pick<AreaVenta, "id" | "nombre" | "cuenta">;
}

export async function addVenta(data: DataVenta) {
  const { userId } = await getSession();

  if (!userId) throw new Error("No autorizado");

  try {
    await db.transaction(async (tx) => {
      const venta = await tx
        .insert(inventarioVentas)
        .values({
          areaVentaId: data.areaVenta.id,
          metodoPago: data.metodoPago,
          createdAt: new Date().toISOString(),
          usuarioId: Number(userId),
          efectivo: "0",
          transferencia: "0",
        })
        .returning();

      const {
        sum_precio_venta,
        ids,
        sum_pago_trabajador,
        descripcion_producto,
      } = await validar_existencia_productos_y_sumatorias_necesarias(
        data.producto_info,
        data.cantidad,
        data.zapatos_id,
        data.areaVenta.id
      );

      if (data.cuentas.length === 1) {
        data.cuentas[0].cantidad = sum_precio_venta;
      }

      if (!data.areaVenta.cuenta) {
        throw new ValidationError(
          "El area de venta no tiene una cuenta asociada."
        );
      }

      await validar_cuentas_para_pago(
        data.cuentas,
        data.metodoPago,
        sum_precio_venta
      );

      await tx
        .update(inventarioProducto)
        .set({ ventaId: venta[0].id })
        .where(inArray(inventarioProducto.id, ids));

      await rebajar_de_las_cuentas({
        areaVenta: data.areaVenta,
        cuentas: data.cuentas,
        tx,
        ids,
        descripcion_producto,
        metodoPago: data.metodoPago,
        sum_pago_trabajador,
        venta,
        userId,
      });

      if (data.metodoPago === METODOS_PAGO.TRANSFERENCIA) {
        await rebajar_pago_trabajador_de_caja_y_crear_transaccion({
          areaVenta: data.areaVenta,
          tx,
          venta,
          userId,
          ids,
          descripcion_producto,
          sum_pago_trabajador,
        });
      }

      await crear_transacciones_de_venta({
        areaVenta: data.areaVenta,
        venta,
        userId,
        tx,
        metodoPago: data.metodoPago,
        cuentas: data.cuentas,
        sum_pago_trabajador,
        ids,
        descripcion_producto,
      });
    });

    revalidatePath(`/area-de-venta/${data.areaVenta.id}`);
    return {
      error: null,
      data: "Venta creada con éxito.",
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
      error: "Algo salió mal.",
    };
  }
}

async function validar_existencia_productos_y_sumatorias_necesarias(
  producto_info: { id: number; isZapato: boolean },
  cantidad: number | undefined,
  zapatos_id: number[] | undefined,
  areaVenta: number
): Promise<{
  sum_precio_venta: number;
  ids: number[];
  sum_pago_trabajador: number;
  descripcion_producto: string;
}> {
  const subqueryHistoricoPrecioVenta = db
    .select({
      precioVenta: inventarioHistorialprecioventasalon.precio,
    })
    .from(inventarioHistorialprecioventasalon)
    .where(
      eq(inventarioHistorialprecioventasalon.productoInfoId, producto_info.id)
    )
    .orderBy(desc(inventarioHistorialprecioventasalon.id))
    .limit(1)
    .as("precioVenta");

  const producto_db = await db
    .select({
      precio_venta: subqueryHistoricoPrecioVenta.precioVenta,
      descripcion: inventarioProductoinfo.descripcion,
      pagoTrabajador: inventarioProductoinfo.pagoTrabajador,
    })
    .from(inventarioProductoinfo)
    .innerJoinLateral(subqueryHistoricoPrecioVenta, sql`true`)
    .where(eq(inventarioProductoinfo.id, producto_info.id))
    .limit(1);

  if (producto_db.length === 0) {
    throw new ValidationError("Producto no encontrado");
  }

  let whereCondition = [
    eq(inventarioProducto.infoId, producto_info.id),
    eq(inventarioProducto.areaVentaId, areaVenta),
    eq(inventarioProducto.almacenRevoltosa, false),
    isNull(inventarioProducto.ventaId),
    isNull(inventarioAjusteinventarioProductos),
  ];

  if (producto_info.isZapato && zapatos_id) {
    whereCondition.push(inArray(inventarioProducto.id, zapatos_id));
  }

  const baseQuery = db
    .select({ id: inventarioProducto.id })
    .from(inventarioProducto)
    .leftJoin(
      inventarioAjusteinventarioProductos,
      eq(inventarioProducto.id, inventarioAjusteinventarioProductos.productoId)
    )
    .where(and(...whereCondition));

  let productos_en_area;

  if (producto_info.isZapato && zapatos_id) {
    productos_en_area = await baseQuery;
  } else if (!producto_info.isZapato && cantidad) {
    productos_en_area = await baseQuery.limit(cantidad);
  } else {
    throw new ValidationError("Mala configuración de parametros");
  }

  if (
    producto_info.isZapato &&
    zapatos_id &&
    productos_en_area.length !== zapatos_id.length
  ) {
    throw new ValidationError(
      "Ids de zapatos incorrectos: Verifique que todos los ids existan"
    );
  } else if (
    !producto_info.isZapato &&
    cantidad &&
    productos_en_area.length !== cantidad
  ) {
    throw new ValidationError(
      `No hay ${producto_db[0].descripcion} suficientes para la venta`
    );
  }

  const cantidad_a_vendida = producto_info.isZapato
    ? productos_en_area.length
    : cantidad ?? 0;

  return {
    sum_precio_venta: Number(producto_db[0].precio_venta) * cantidad_a_vendida,
    ids: productos_en_area.map((item) => item.id),
    sum_pago_trabajador: producto_db[0].pagoTrabajador * cantidad_a_vendida,
    descripcion_producto: producto_db[0].descripcion,
  };
}

async function validar_cuentas_para_pago(
  cuentas: InferOutput<typeof VentasSchema.entries.cuentas>,
  metodo_pago: METODOS_PAGO,
  sum_precio_venta: number
) {
  if (cuentas.length === 1 && metodo_pago === METODOS_PAGO.MIXTO) {
    throw new ValidationError(
      "El método de pago MIXTO requiere al menos 2 cuentas"
    );
  }

  const idsUnicos = Array.from(new Set(cuentas.map((c) => Number(c.cuenta))));

  const cuentasDb = await db
    .select({ id: inventarioCuentas.id, tipo: inventarioCuentas.tipo })
    .from(inventarioCuentas)
    .where(inArray(inventarioCuentas.id, idsUnicos));

  if (cuentasDb.length !== idsUnicos.length) {
    throw new ValidationError("Alguna de las cuentas seleccionadas no existe");
  }

  const idToTipo = new Map<number, string>(
    cuentasDb.map((c) => [Number(c.id), c.tipo])
  );

  const tiposSeleccionados = new Set(idsUnicos.map((id) => idToTipo.get(id)));

  switch (metodo_pago) {
    case METODOS_PAGO.EFECTIVO: {
      const valido =
        tiposSeleccionados.size === 1 &&
        tiposSeleccionados.has(TipoCuenta.EFECTIVO);
      if (!valido) {
        throw new ValidationError("Cuenta no válida para el método EFECTIVO");
      }
      break;
    }
    case METODOS_PAGO.TRANSFERENCIA: {
      const valido =
        tiposSeleccionados.size === 1 &&
        tiposSeleccionados.has(TipoCuenta.BANCARIA);
      if (!valido) {
        throw new ValidationError(
          "Cuenta no válida para el método TRANSFERENCIA"
        );
      }
      break;
    }
    case METODOS_PAGO.MIXTO: {
      const hayEfectivo = tiposSeleccionados.has(TipoCuenta.EFECTIVO);
      const hayBancaria = tiposSeleccionados.has(TipoCuenta.BANCARIA);
      if (!hayEfectivo || !hayBancaria) {
        throw new ValidationError(
          "En pagos mixtos debe existir al menos una cuenta EFECTIVO y una BANCARIA"
        );
      }
      break;
    }
  }

  const totalCuentasCents = cuentas.reduce((acc, c) => {
    const cantidad = c.cantidad ?? 0;
    if (cantidad < 0) {
      throw new ValidationError("La cantidad por cuenta no puede ser negativa");
    }
    return acc + Math.round(cantidad * 100);
  }, 0);
  const totalVentaCents = Math.round(sum_precio_venta * 100);

  if (totalCuentasCents !== totalVentaCents) {
    throw new ValidationError(
      "El total de las cantidades de las cuentas no coincide con el precio de venta"
    );
  }
}

async function rebajar_de_las_cuentas({
  cuentas,
  metodoPago,
  sum_pago_trabajador,
  tx,
  ids,
  descripcion_producto,
  areaVenta,
  venta,
  userId,
}: {
  cuentas: InferOutput<typeof VentasSchema.entries.cuentas>;
  metodoPago: METODOS_PAGO;
  sum_pago_trabajador: number;
  tx: DrizzleTransaction;
  ids: number[];
  descripcion_producto: string;
  areaVenta: {
    id: number;
    nombre: string;
    cuenta: { id: number; nombre: string } | null;
  };
  venta: InferSelectModel<typeof inventarioVentas>[];
  userId: string;
}) {
  if (!areaVenta.cuenta) throw new Error("La cuenta es requerida.");

  for (let index = 0; index < cuentas.length; index++) {
    const cuenta = cuentas[index];
    let deltaCents =
      Math.round((cuenta.cantidad ?? 0) * 100) -
      (metodoPago === METODOS_PAGO.EFECTIVO
        ? Math.round(sum_pago_trabajador * 100)
        : 0);

    if (metodoPago === METODOS_PAGO.MIXTO && index === 0) {
      const cantidadAsignada = cuenta?.cantidad ?? 0;

      if (cantidadAsignada === sum_pago_trabajador) {
        continue;
      }

      if (cantidadAsignada < sum_pago_trabajador) {
        const cuentaDB = await db
          .select()
          .from(inventarioCuentas)
          .where(eq(inventarioCuentas.id, Number(cuenta.cuenta)));

        const saldoActual = Number(cuentaDB[0].saldo);

        if (saldoActual < sum_pago_trabajador) {
          throw new ValidationError(
            "No hay suficiente saldo en la cuenta para realizar el pago al trabajador"
          );
        }

        const cantidadDescuento = sum_pago_trabajador - cantidadAsignada;

        await tx
          .update(inventarioCuentas)
          .set({
            saldo: sql`${inventarioCuentas.saldo} - ${cantidadDescuento}`,
          })
          .where(eq(inventarioCuentas.id, Number(cuenta.cuenta)));

        await tx.insert(inventarioTransacciones).values({
          createdAt: new Date().toISOString(),
          descripcion: `${ids.length}x ${descripcion_producto.slice(0, 20)}`,
          cuentaId: areaVenta.cuenta?.id,
          ventaId: venta[0].id,
          tipo: TipoTransferencia.PAGO_TRABAJADOR,
          cantidad: String(cantidadDescuento),
          usuarioId: Number(userId),
        });

        continue;
      }

      if (cantidadAsignada > sum_pago_trabajador) {
        deltaCents -= Math.round(sum_pago_trabajador * 100);
      }
    }

    await tx
      .update(inventarioCuentas)
      .set({
        saldo: sql`${inventarioCuentas.saldo} + ${sql.raw(
          `(${deltaCents}::numeric / 100.0)`
        )}`,
      })
      .where(eq(inventarioCuentas.id, Number(cuenta.cuenta)));
  }
}

async function rebajar_pago_trabajador_de_caja_y_crear_transaccion({
  sum_pago_trabajador,
  tx,
  venta,
  userId,
  ids,
  descripcion_producto,
  areaVenta,
}: {
  sum_pago_trabajador: number;
  tx: DrizzleTransaction;
  venta: InferSelectModel<typeof inventarioVentas>[];
  userId: string;
  ids: number[];
  descripcion_producto: string;
  areaVenta: Pick<AreaVenta, "id" | "nombre" | "cuenta">;
}) {
  if (!areaVenta.cuenta) throw new Error("La cuenta es requerida.");
  const pagoTrabajador = Math.round(sum_pago_trabajador * 100);
  await tx
    .update(inventarioCuentas)
    .set({
      saldo: sql`${inventarioCuentas.saldo} + ${sql.raw(
        `(${pagoTrabajador}::numeric / 100.0)`
      )}`,
    })
    .where(eq(inventarioCuentas.id, areaVenta.cuenta?.id));

  await tx.insert(inventarioTransacciones).values({
    createdAt: new Date().toISOString(),
    descripcion: `${ids.length}x ${descripcion_producto.slice(0, 20)}`,
    cuentaId: areaVenta.cuenta.id,
    ventaId: venta[0].id,
    tipo: TipoTransferencia.PAGO_TRABAJADOR,
    cantidad: String(sum_pago_trabajador),
    usuarioId: Number(userId),
  });
}

async function crear_transacciones_de_venta({
  metodoPago,
  cuentas,
  sum_pago_trabajador,
  ids,
  descripcion_producto,
  tx,
  areaVenta,
  venta,
  userId,
}: {
  metodoPago: METODOS_PAGO;
  cuentas: InferOutput<typeof VentasSchema.entries.cuentas>;
  sum_pago_trabajador: number;
  ids: number[];
  descripcion_producto: string;
  tx: DrizzleTransaction;
  areaVenta: Pick<AreaVenta, "id" | "nombre" | "cuenta">;
  venta: InferSelectModel<typeof inventarioVentas>[];
  userId: string;
}) {
  const cuentasParaTransacciones =
    metodoPago === METODOS_PAGO.MIXTO &&
    (cuentas[0].cantidad ?? 0) <= sum_pago_trabajador
      ? cuentas.filter((_, index) => index !== 0)
      : cuentas.map((c, index) => ({
          ...c,
          cantidad:
            metodoPago === METODOS_PAGO.EFECTIVO ||
            (metodoPago === METODOS_PAGO.MIXTO && index === 0)
              ? (c.cantidad ?? 0) - sum_pago_trabajador
              : c.cantidad ?? 0,
        }));

  await tx.insert(inventarioTransacciones).values(
    cuentasParaTransacciones.map((cuenta) => ({
      createdAt: new Date().toISOString(),
      descripcion: `${ids.length}x ${descripcion_producto.slice(0, 20)} - ${
        areaVenta.nombre
      }`,
      cuentaId: Number(cuenta.cuenta),
      ventaId: venta[0].id,
      tipo: TipoTransferencia.VENTA,
      cantidad: String(cuenta.cantidad),
      usuarioId: Number(userId),
    }))
  );
}

export async function deleteVenta({
  id,
}: {
  id: number;
}): Promise<ResultPattern> {
  try {
    const venta = await db
      .select({
        id: inventarioVentas.id,
        usuarioId: inventarioVentas.usuarioId,
        createdAt: inventarioVentas.createdAt,
      })
      .from(inventarioVentas)
      .where(eq(inventarioVentas.id, id))
      .limit(1);

    await validaciones_eliminar_venta({ venta });

    const cuentasConTransacciones = await db
      .select({
        cuenta: {
          id: inventarioCuentas.id,
          saldo: inventarioCuentas.saldo,
          nombre: inventarioCuentas.nombre,
        },
        transaccion: {
          id: inventarioTransacciones.id,
          cantidad: inventarioTransacciones.cantidad,
          tipo: inventarioTransacciones.tipo,
        },
      })
      .from(inventarioCuentas)
      .innerJoin(
        inventarioTransacciones,
        eq(inventarioCuentas.id, inventarioTransacciones.cuentaId)
      )
      .where(eq(inventarioTransacciones.ventaId, venta[0].id));

    await db.transaction(async (tx) => {
      retornar_saldo_de_y_hacia_cuentas({ cuentasConTransacciones, tx });

      await tx.delete(inventarioTransacciones).where(
        inArray(
          inventarioTransacciones.id,
          cuentasConTransacciones.map((c) => c.transaccion.id)
        )
      );
      await tx
        .delete(inventarioVentas)
        .where(eq(inventarioVentas.id, venta[0].id));
    });

    revalidatePath(`/area-de-venta/${id}`);
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
      error: "Error al eliminar la venta.",
    };
  }
}

async function validaciones_eliminar_venta({
  venta,
}: {
  venta: Pick<
    InferSelectModel<typeof inventarioVentas>,
    "id" | "usuarioId" | "createdAt"
  >[];
}) {
  const { userId, isAdmin } = await getSession();

  if (venta.length < 1) throw new ValidationError("Venta no encontrada");
  if (venta[0].usuarioId !== Number(userId) && !isAdmin)
    throw new AuthorizationError();

  const HOY = new Date();
  HOY.setHours(0, 0, 0, 0);
  if (new Date(venta[0].createdAt) < HOY && !isAdmin)
    throw new ValidationError("Expiro el tiempo para eliminar la venta");
}

function retornar_saldo_de_y_hacia_cuentas({
  cuentasConTransacciones,
  tx,
}: {
  cuentasConTransacciones: {
    cuenta: {
      id: number;
      saldo: string;
      nombre: string;
    };
    transaccion: {
      id: number;
      cantidad: string;
      tipo: string;
    };
  }[];
  tx: DrizzleTransaction;
}) {
  cuentasConTransacciones.forEach(async ({ cuenta, transaccion }) => {
    if (
      transaccion.tipo === TipoTransferencia.VENTA &&
      Number(cuenta.saldo) < Number(transaccion.cantidad)
    ) {
      throw new ValidationError(
        `Saldo insuficiente en ${cuenta.nombre} para eliminar la venta.`
      );
    }
    const saldoADescontar = () => {
      switch (transaccion.tipo) {
        case TipoTransferencia.VENTA:
          return sql<string>`${inventarioCuentas.saldo} - ${transaccion.cantidad}`;
        case TipoTransferencia.PAGO_TRABAJADOR:
          return sql<string>`${inventarioCuentas.saldo} + ${transaccion.cantidad}`;
        default:
          throw new Error("Tipo transaccion corrupto");
      }
    };
    await tx
      .update(inventarioCuentas)
      .set({ saldo: saldoADescontar() })
      .where(eq(inventarioCuentas.id, cuenta.id));
  });
}
