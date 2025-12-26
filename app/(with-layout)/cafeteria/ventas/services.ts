import { db } from "@/db/initial";
import {
  inventarioCuentas,
  inventarioElaboraciones,
  inventarioElaboracionesVentasCafeteria,
  inventarioInventarioAreaCafeteria,
  inventarioProductosCafeteria,
  inventarioProductosVentasCafeteria,
  inventarioTransacciones,
  inventarioUser,
  inventarioVentasCafeteria,
  inventarioVentasCafeteriaElaboraciones,
  inventarioVentasCafeteriaProductos,
} from "@/db/schema";
import {
  Banco,
  TipoCuenta,
  TipoTransferencia,
} from "../../finanzas/transacciones/types";
import { and, desc, eq, sql, sum } from "drizzle-orm";
import { CuentasInVentasCafeteria, Prod_Elab_Venta } from "../types";
import { METODOS_PAGO } from "../../(almacen-cafeteria)/entradas-cafeteria/types";
import { searchParamsCache } from "./searchParams";
import { MAX_TRANF_DIA, MAX_TRANF_MES } from "@/lib/utils";

export async function ventasCafeteria() {
  const { p: page, l: limit } = searchParamsCache.all();
  try {
    const safeLimit = Math.min(limit, 100);
    const offset = (page - 1) * safeLimit;

    const transaccionesAgg = db
      .select({
        ventaId: inventarioTransacciones.ventaCafeteriaId,
        cuentas:
          sql`jsonb_agg(jsonb_build_object('id', ${inventarioCuentas.id}, 'nombre', ${inventarioCuentas.nombre}, 'tipo', ${inventarioCuentas.tipo}, 'cantidad', ${inventarioTransacciones.cantidad}) ORDER BY CASE WHEN ${inventarioCuentas.tipo} = ${TipoCuenta.EFECTIVO} THEN 1 ELSE 2 END) FILTER (WHERE ${inventarioTransacciones.tipo} != ${TipoTransferencia.PAGO_TRABAJADOR})`.as(
            "cuentas"
          ),
        ingresoPorVenta:
          sql<string>`coalesce(sum(case when ${inventarioTransacciones.tipo} = ${TipoTransferencia.VENTA} then ${inventarioTransacciones.cantidad} else 0 end), 0)::numeric(20, 10)`.as(
            "ingreso_por_venta"
          ),
        gastoPagoTrabajador:
          sql<string>`coalesce(sum(case when ${inventarioTransacciones.tipo} = ${TipoTransferencia.PAGO_TRABAJADOR} then ${inventarioTransacciones.cantidad} else 0 end), 0)::numeric(20, 10)`.as(
            "gasto_pago_trabajador"
          ),
        ingresoEfectivo:
          sql<string>`coalesce(sum(case when ${inventarioTransacciones.tipo} = ${TipoTransferencia.VENTA} and ${inventarioCuentas.tipo} = ${TipoCuenta.EFECTIVO} then ${inventarioTransacciones.cantidad} else 0 end), 0)::numeric(20, 10)`.as(
            "ingreso_efectivo"
          ),
        ingresoBancario:
          sql<string>`coalesce(sum(case when ${inventarioTransacciones.tipo} = ${TipoTransferencia.VENTA} and ${inventarioCuentas.tipo} = ${TipoCuenta.BANCARIA} then ${inventarioTransacciones.cantidad} else 0 end), 0)::numeric(20, 10)`.as(
            "ingreso_bancario"
          ),
      })
      .from(inventarioTransacciones)
      .innerJoin(
        inventarioCuentas,
        eq(inventarioCuentas.id, inventarioTransacciones.cuentaId)
      )
      .where(
        eq(
          inventarioTransacciones.ventaCafeteriaId,
          inventarioVentasCafeteria.id
        )
      )
      .groupBy(inventarioTransacciones.ventaCafeteriaId)
      .as("transacciones_agg");

    const productosAgg = db
      .select({
        ventaId: inventarioVentasCafeteriaProductos.ventasCafeteriaId,
        productos: sql<Prod_Elab_Venta[]>`
            json_agg(
              jsonb_build_object(
                'id', ${inventarioProductosCafeteria.id},
                'nombre', ${inventarioProductosCafeteria.nombre},
                'cantidad', ${inventarioProductosVentasCafeteria.cantidad}
              )
            )`.as("productos"),
      })
      .from(inventarioVentasCafeteriaProductos)
      .innerJoin(
        inventarioProductosVentasCafeteria,
        eq(
          inventarioProductosVentasCafeteria.id,
          inventarioVentasCafeteriaProductos.productosVentasCafeteriaId
        )
      )
      .innerJoin(
        inventarioProductosCafeteria,
        eq(
          inventarioProductosCafeteria.id,
          inventarioProductosVentasCafeteria.productoId
        )
      )
      .where(
        eq(
          inventarioVentasCafeteriaProductos.ventasCafeteriaId,
          inventarioVentasCafeteria.id
        )
      )
      .groupBy(inventarioVentasCafeteriaProductos.ventasCafeteriaId)
      .as("productos_agg");

    const elaboracionesAgg = db
      .select({
        ventaId: inventarioVentasCafeteriaElaboraciones.ventasCafeteriaId,
        elaboraciones: sql<Prod_Elab_Venta[]>`
            json_agg(
              jsonb_build_object(
                'id', ${inventarioElaboraciones.id},
                'nombre', ${inventarioElaboraciones.nombre},
                'cantidad', ${inventarioElaboracionesVentasCafeteria.cantidad}
              )
            )`.as("elaboraciones"),
      })
      .from(inventarioVentasCafeteriaElaboraciones)
      .innerJoin(
        inventarioElaboracionesVentasCafeteria,
        eq(
          inventarioElaboracionesVentasCafeteria.id,
          inventarioVentasCafeteriaElaboraciones.elaboracionesVentasCafeteriaId
        )
      )
      .innerJoin(
        inventarioElaboraciones,
        eq(
          inventarioElaboraciones.id,
          inventarioElaboracionesVentasCafeteria.productoId
        )
      )
      .where(
        eq(
          inventarioVentasCafeteriaElaboraciones.ventasCafeteriaId,
          inventarioVentasCafeteria.id
        )
      )
      .groupBy(inventarioVentasCafeteriaElaboraciones.ventasCafeteriaId)
      .as("elaboraciones_agg");

    const ventasConConteo = await db
      .select({
        id: inventarioVentasCafeteria.id,
        createdAt: inventarioVentasCafeteria.createdAt,
        usuario: inventarioUser.username,
        metodoPago: sql<METODOS_PAGO>`${inventarioVentasCafeteria.metodoPago}`,
        cuentas: sql<
          CuentasInVentasCafeteria[]
        >`coalesce(${transaccionesAgg.cuentas}, '[]'::jsonb)`,
        importe:
          sql<string>`(coalesce(${transaccionesAgg.ingresoPorVenta}, 0) - coalesce(${transaccionesAgg.gastoPagoTrabajador}, 0))`.as(
            "importe"
          ),
        efectivo:
          sql<string>`(coalesce(${transaccionesAgg.ingresoEfectivo}, 0) - coalesce(${transaccionesAgg.gastoPagoTrabajador}, 0))`.as(
            "efectivo"
          ),
        transferencia:
          sql<string>`coalesce(${transaccionesAgg.ingresoBancario}, 0)`.as(
            "transferencia"
          ),
        productos: sql<
          Prod_Elab_Venta[]
        >`coalesce(${productosAgg.productos}, '[]'::json)`,
        elaboraciones: sql<
          Prod_Elab_Venta[]
        >`coalesce(${elaboracionesAgg.elaboraciones}, '[]'::json)`,
        totalCount: sql<number>`COUNT(*) OVER()`.as("total_count"),
      })
      .from(inventarioVentasCafeteria)
      .leftJoin(
        inventarioUser,
        eq(inventarioUser.id, inventarioVentasCafeteria.usuarioId)
      )
      .leftJoinLateral(transaccionesAgg, sql`true`)
      .leftJoinLateral(productosAgg, sql`true`)
      .leftJoinLateral(elaboracionesAgg, sql`true`)
      .orderBy(desc(inventarioVentasCafeteria.createdAt))
      .limit(safeLimit)
      .offset(offset);

    const totalCount = ventasConConteo[0]?.totalCount ?? 0;
    const pageCount = Math.ceil(totalCount / safeLimit);

    const ventas = ventasConConteo.map(({ totalCount, ...rest }) => rest);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const transaccionesAgregadas = db.$with("transacciones_agregadas").as(
      db
        .select({
          cuentaId: inventarioTransacciones.cuentaId,
          totalMes: sum(
            sql<number>`CASE WHEN ${inventarioTransacciones.createdAt} >= ${startOfMonth} THEN ${inventarioTransacciones.cantidad} ELSE 0 END`
          )
            .mapWith(Number)
            .as("total_mes"),
          totalDia: sum(
            sql<number>`CASE WHEN ${inventarioTransacciones.createdAt} >= ${startOfDay} THEN ${inventarioTransacciones.cantidad} ELSE 0 END`
          )
            .mapWith(Number)
            .as("total_dia"),
        })
        .from(inventarioTransacciones)
        .groupBy(inventarioTransacciones.cuentaId)
    );

    const tarjetas = await db
      .with(transaccionesAgregadas)
      .select({
        id: inventarioCuentas.id,
        nombre: inventarioCuentas.nombre,
        banco: sql<Banco | null>`${inventarioCuentas.banco}`,
        disponible:
          sql<boolean>`COALESCE(${transaccionesAgregadas.totalMes}, 0) < ${MAX_TRANF_MES} AND COALESCE(${transaccionesAgregadas.totalDia}, 0) < ${MAX_TRANF_DIA}`.mapWith(
            Boolean
          ),
      })
      .from(inventarioCuentas)
      .leftJoin(
        transaccionesAgregadas,
        eq(inventarioCuentas.id, transaccionesAgregadas.cuentaId)
      )
      .where(
        and(
          eq(inventarioCuentas.tipo, TipoCuenta.BANCARIA),
          eq(inventarioCuentas.active, true)
        )
      );

    const productosConInventario = db
      .select({
        id: inventarioProductosCafeteria.id,
        nombre: inventarioProductosCafeteria.nombre,
        isElaboracion: sql<boolean>`false`,
      })
      .from(inventarioProductosCafeteria)
      .innerJoin(
        inventarioInventarioAreaCafeteria,
        eq(
          inventarioInventarioAreaCafeteria.productoId,
          inventarioProductosCafeteria.id
        )
      )
      .where(sql`${inventarioInventarioAreaCafeteria.cantidad} > 0`);

    const todasLasElaboraciones = db
      .select({
        id: inventarioElaboraciones.id,
        nombre: inventarioElaboraciones.nombre,
        isElaboracion: sql<boolean>`true`,
      })
      .from(inventarioElaboraciones);

    const productos_elaboraciones = await productosConInventario.unionAll(
      todasLasElaboraciones
    );

    return {
      data: {
        ventas,
        tarjetas,
        productos_elaboraciones,
      },
      meta: {
        pageCount,
        totalCount,
      },
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: [],
      meta: null,
      error: "Error al obtener las ventas.",
    };
  }
}
