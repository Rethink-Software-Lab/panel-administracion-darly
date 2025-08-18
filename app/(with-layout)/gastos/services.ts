import { db } from "@/db/initial";
import {
  inventarioAreaventa,
  inventarioGastos,
  inventarioUser,
} from "@/db/schema";
import { Gasto, ResponseGastos, TiposGastos } from "./types";
import { desc, eq } from "drizzle-orm";
import { ValidationError } from "@/lib/errors";

export async function getGastos(): Promise<{
  data: ResponseGastos | null;
  error: string | null;
}> {
  try {
    const areas_venta = await db
      .select({
        id: inventarioAreaventa.id,
        nombre: inventarioAreaventa.nombre,
      })
      .from(inventarioAreaventa);

    const gastos = await db
      .select({
        id: inventarioGastos.id,
        descripcion: inventarioGastos.descripcion,
        tipo: inventarioGastos.tipo,
        cantidad: inventarioGastos.cantidad,
        created_at: inventarioGastos.createdAt,
        area_venta: inventarioAreaventa.nombre,
        is_cafeteria: inventarioGastos.isCafeteria,
        frecuencia: inventarioGastos.frecuencia,
        usuario: inventarioUser.username,
        dia_mes: inventarioGastos.diaMes,
        dia_semana: inventarioGastos.diaSemana,
      })
      .from(inventarioGastos)
      .leftJoin(inventarioUser, eq(inventarioGastos.id, inventarioUser.id))
      .leftJoin(
        inventarioAreaventa,
        eq(inventarioGastos.id, inventarioAreaventa.id)
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
