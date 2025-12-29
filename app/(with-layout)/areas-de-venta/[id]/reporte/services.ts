import {
  TipoCuenta,
  TipoTransferencia,
} from "@/app/(with-layout)/finanzas/transacciones/types";
import { db } from "@/db/initial";
import {
  inventarioCuentas,
  inventarioProducto,
  inventarioProductoinfo,
  inventarioTransacciones,
  inventarioVentas,
} from "@/db/schema";
import { getSession } from "@/lib/getSession";
import { and, count, eq, gte } from "drizzle-orm";

export async function getReporteVentasAreaVenta(areaVentaId: number) {
  const fechaInicioDia = new Date();
  fechaInicioDia.setHours(0, 0, 0, 0);

  const session = await getSession();
  const userId = session?.user.id;

  try {
    const p = await db
      .select({
        id: inventarioProductoinfo.id,
        descripcion: inventarioProductoinfo.descripcion,
        cantidad: count(inventarioProducto),
      })
      .from(inventarioProductoinfo)
      .innerJoin(
        inventarioProducto,
        eq(inventarioProducto.infoId, inventarioProductoinfo.id)
      )
      .innerJoin(
        inventarioVentas,
        eq(inventarioProducto.ventaId, inventarioVentas.id)
      )
      .where(
        and(
          gte(inventarioVentas.createdAt, fechaInicioDia.toISOString()),
          eq(inventarioProducto.areaVentaId, areaVentaId)
        )
      )
      .groupBy(inventarioProductoinfo.id);

    const transacciones = await db
      .select()
      .from(inventarioTransacciones)
      .innerJoin(
        inventarioVentas,
        eq(inventarioTransacciones.ventaId, inventarioVentas.id)
      )
      .innerJoin(
        inventarioCuentas,
        eq(inventarioTransacciones.cuentaId, inventarioCuentas.id)
      )
      .where(
        and(
          gte(inventarioVentas.createdAt, fechaInicioDia.toISOString()),
          eq(inventarioVentas.areaVentaId, areaVentaId)
        )
      );

    const resumen = transacciones.reduce(
      (acc, row) => {
        const cantidad = parseFloat(row.inventario_transacciones.cantidad);
        const tipoTransaccion = row.inventario_transacciones
          .tipo as TipoTransferencia;
        const tipoCuenta = row.inventario_cuentas.tipo;

        if (
          tipoCuenta === TipoCuenta.BANCARIA &&
          [TipoTransferencia.VENTA, TipoTransferencia.INGRESO].includes(
            tipoTransaccion
          )
        ) {
          acc.transferencia += cantidad;
        }

        if (
          tipoCuenta === TipoCuenta.EFECTIVO &&
          [TipoTransferencia.VENTA, TipoTransferencia.INGRESO].includes(
            tipoTransaccion
          )
        ) {
          acc.efectivo += cantidad;
        }

        if (
          tipoCuenta === TipoCuenta.EFECTIVO &&
          [
            TipoTransferencia.PAGO_TRABAJADOR,
            TipoTransferencia.EGRESO,
          ].includes(tipoTransaccion) &&
          row.inventario_transacciones.usuarioId === userId
        ) {
          acc.pagos += cantidad;
        }

        return acc;
      },
      { transferencia: 0, efectivo: 0, pagos: 0 }
    );

    return {
      data: {
        productos: p,
        total: resumen.efectivo + resumen.transferencia,
        efectivo: resumen.efectivo,
        transferencia: resumen.transferencia,
        pagoTrabajador: resumen.pagos,
      },
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al obtenel el reporte.",
    };
  }
}
