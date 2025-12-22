import { db } from "@/db/initial";
import { inventarioAreaventa } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ValidationError } from "@/lib/errors";

export async function getAreaVenta(id: number) {
  try {
    const [areaVenta] = await db
      .select({
        id: inventarioAreaventa.id,
        nombre: inventarioAreaventa.nombre,
      })
      .from(inventarioAreaventa)
      .where(
        and(
          eq(inventarioAreaventa.id, id),
          eq(inventarioAreaventa.active, true)
        )
      )
      .limit(1);

    if (!areaVenta) {
      throw new ValidationError("No se encontro la area de venta");
    }

    return {
      error: null,
      data: areaVenta,
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
      error: "Error al obtener la area de venta.",
    };
  }
}
