import { db } from "@/db/initial";
import {
  inventarioAreaventa,
  inventarioCuentas,
  inventarioGastos,
  inventarioGastosAreasVenta,
  inventarioUser,
} from "@/db/schema";
import { Gasto, TiposGastos } from "./types";
import { desc, eq, sql } from "drizzle-orm";
import { ValidationError } from "@/lib/errors";

export async function getGastos() {
  try {
    const areas_venta = await db
      .select({
        id: inventarioAreaventa.id,
        nombre: inventarioAreaventa.nombre,
      })
      .from(inventarioAreaventa)
      .where(eq(inventarioAreaventa.active, true));

    const cuentas = await db
      .select({
        id: inventarioCuentas.id,
        nombre: inventarioCuentas.nombre,
        tipo: inventarioCuentas.tipo,
        banco: inventarioCuentas.banco,
      })
      .from(inventarioCuentas);

    const gastos = await db
      .select({
        id: inventarioGastos.id,
        descripcion: inventarioGastos.descripcion,
        tipo: inventarioGastos.tipo,
        cantidad: inventarioGastos.cantidad,
        created_at: inventarioGastos.createdAt,
        cuenta: {
          id: inventarioCuentas.id,
          nombre: inventarioCuentas.nombre,
        },
        areas_venta: sql<
          { id: number; nombre: string }[]
        >`COALESCE(json_agg(json_build_object('id', ${inventarioAreaventa.id}, 'nombre', ${inventarioAreaventa.nombre})) FILTER (WHERE ${inventarioAreaventa.id} IS NOT NULL), '[]'::json)`,
        is_cafeteria: inventarioGastos.isCafeteria,
        frecuencia: inventarioGastos.frecuencia,
        usuario: inventarioUser.username,
        diaMes: inventarioGastos.diaMes,
        diaSemana: inventarioGastos.diaSemana,
      })
      .from(inventarioGastos)
      .leftJoin(
        inventarioUser,
        eq(inventarioGastos.usuarioId, inventarioUser.id)
      )
      .leftJoin(
        inventarioGastosAreasVenta,
        eq(inventarioGastosAreasVenta.gastosId, inventarioGastos.id)
      )
      .leftJoin(
        inventarioAreaventa,
        eq(inventarioAreaventa.id, inventarioGastosAreasVenta.areaventaId)
      )
      .leftJoin(
        inventarioCuentas,
        eq(inventarioCuentas.id, inventarioGastos.cuentaId)
      )
      .groupBy(
        inventarioGastos.id,
        inventarioCuentas.id,
        inventarioUser.username
      )
      .orderBy(desc(inventarioGastos.id));

    const gastos_fijos: Gasto[] = [];
    const gastos_variables: Gasto[] = [];

    for (const gasto of gastos) {
      switch (gasto.tipo) {
        case TiposGastos.FIJO:
          gastos_fijos.push(gasto);
          break;

        case TiposGastos.VARIABLE:
          gastos_variables.push(gasto);
          break;

        default:
          throw new ValidationError(
            "Tipo de Gasto solo puede ser fijo o variable"
          );
      }
    }

    return {
      data: {
        fijos: gastos_fijos,
        variables: gastos_variables,
        areas_venta: areas_venta,
        cuentas,
      },
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al obtener los Gastos.",
    };
  }
}
