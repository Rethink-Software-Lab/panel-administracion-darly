import { ProductosInEntrada } from "./types";
import { db } from "@/db/initial";
import {
  inventarioCuentas,
  inventarioEntradasCafeteria,
  inventarioEntradasCafeteriaProductos,
  inventarioHistorialpreciocostocafeteria,
  inventarioHistorialprecioventacafeteria,
  inventarioProductosCafeteria,
  inventarioProductosEntradasCafeteria,
  inventarioProveedor,
  inventarioUser,
} from "@/db/schema";
import { and, desc, eq, getTableColumns, lte, sql } from "drizzle-orm";
import { Banco, TipoCuenta } from "../../finanzas/transacciones/types";

export async function getEntradasCafeteria() {
  try {
    const subqueryHistoricoPrecioVenta = db
      .select({
        precioVenta: inventarioHistorialprecioventacafeteria.precio,
      })
      .from(inventarioHistorialprecioventacafeteria)
      .where(
        eq(
          inventarioHistorialprecioventacafeteria.productoId,
          inventarioProductosCafeteria.id
        )
      )
      .orderBy(desc(inventarioHistorialprecioventacafeteria.id))
      .limit(1)
      .as("precioVenta");

    const subqueryHistoricoPrecioCosto = db
      .select({
        precioCosto: inventarioHistorialpreciocostocafeteria.precio,
      })
      .from(inventarioHistorialpreciocostocafeteria)
      .where(
        eq(
          inventarioHistorialpreciocostocafeteria.productoId,
          inventarioProductosCafeteria.id
        )
      )
      .orderBy(desc(inventarioHistorialpreciocostocafeteria.id))
      .limit(1)
      .as("precioCosto");

    const costPriceAsOfEntryDateSq = db
      .select({ value: inventarioHistorialpreciocostocafeteria.precio })
      .from(inventarioHistorialpreciocostocafeteria)
      .where(
        and(
          eq(
            inventarioHistorialpreciocostocafeteria.productoId,
            inventarioProductosCafeteria.id
          ),
          lte(
            inventarioHistorialpreciocostocafeteria.fechaInicio,
            inventarioEntradasCafeteria.createdAt
          )
        )
      )
      .orderBy(desc(inventarioHistorialpreciocostocafeteria.fechaInicio))
      .limit(1);

    const salePriceAsOfEntryDateSq = db
      .select({ value: inventarioHistorialprecioventacafeteria.precio })
      .from(inventarioHistorialprecioventacafeteria)
      .where(
        and(
          eq(
            inventarioHistorialprecioventacafeteria.productoId,
            inventarioProductosCafeteria.id
          ),
          lte(
            inventarioHistorialprecioventacafeteria.fechaInicio,
            inventarioEntradasCafeteria.createdAt
          )
        )
      )
      .orderBy(desc(inventarioHistorialprecioventacafeteria.fechaInicio))
      .limit(1);

    const [productos, cuentas, proveedores, entradas] = await Promise.all([
      db
        .select({
          id: inventarioProductosCafeteria.id,
          nombre: inventarioProductosCafeteria.nombre,
          precio_costo: subqueryHistoricoPrecioCosto.precioCosto,
          precio_venta: subqueryHistoricoPrecioVenta.precioVenta,
        })
        .from(inventarioProductosCafeteria)
        .innerJoinLateral(subqueryHistoricoPrecioVenta, sql`true`)
        .innerJoinLateral(subqueryHistoricoPrecioCosto, sql`true`)
        .then((r) =>
          r.map((p) => ({
            ...p,
            precio_venta: parseFloat(p.precio_venta),
          }))
        ),
      db
        .select({
          id: inventarioCuentas.id,
          nombre: inventarioCuentas.nombre,
          tipo: sql<TipoCuenta>`${inventarioCuentas.tipo}`,
          banco: sql<Banco | null>`${inventarioCuentas.banco}`,
          saldo: inventarioCuentas.saldo,
        })
        .from(inventarioCuentas),
      db
        .select({
          id: inventarioProveedor.id,
          nombre: inventarioProveedor.nombre,
        })
        .from(inventarioProveedor),
      db
        .select({
          ...getTableColumns(inventarioEntradasCafeteria),
          usuario: inventarioUser.username,
          proveedor: inventarioProveedor,
          productos: sql<ProductosInEntrada[]>`
        COALESCE(
          json_agg(
            json_build_object(
              'id', ${inventarioProductosEntradasCafeteria.id},
              'cantidad', ${inventarioProductosEntradasCafeteria.cantidad},
              'producto', json_build_object(
                'id', ${inventarioProductosCafeteria.id},
                'nombre', ${inventarioProductosCafeteria.nombre},
                'precio_costo', (${costPriceAsOfEntryDateSq}),
                'precio_venta', (${salePriceAsOfEntryDateSq})
              )
            )
          ) FILTER (WHERE ${inventarioProductosCafeteria.id} IS NOT NULL),
          '[]'::json
        )
      `.as("productos"),
        })
        .from(inventarioEntradasCafeteria)
        .leftJoin(
          inventarioProveedor,
          eq(inventarioEntradasCafeteria.proveedorId, inventarioProveedor.id)
        )
        .leftJoin(
          inventarioEntradasCafeteriaProductos,
          eq(
            inventarioEntradasCafeteria.id,
            inventarioEntradasCafeteriaProductos.entradasCafeteriaId
          )
        )
        .leftJoin(
          inventarioProductosEntradasCafeteria,
          eq(
            inventarioEntradasCafeteriaProductos.productosEntradasCafeteriaId,
            inventarioProductosEntradasCafeteria.id
          )
        )
        .leftJoin(
          inventarioProductosCafeteria,
          eq(
            inventarioProductosEntradasCafeteria.productoId,
            inventarioProductosCafeteria.id
          )
        )
        .leftJoin(
          inventarioUser,
          eq(inventarioEntradasCafeteria.usuarioId, inventarioUser.id)
        )
        .groupBy(
          inventarioEntradasCafeteria.id,
          inventarioProveedor.id,
          inventarioUser.username
        )
        .orderBy(desc(inventarioEntradasCafeteria.id)),
    ]);

    return {
      error: null,
      data: {
        productos,
        entradas,
        cuentas,
        proveedores,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al obtener las entradas.",
    };
  }
}
