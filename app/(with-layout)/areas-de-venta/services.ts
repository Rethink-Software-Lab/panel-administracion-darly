import { db } from "@/db/initial";
import { inventarioAreaventa } from "@/db/schema";
import { AreaVenta } from "./types";
import { desc, eq } from "drizzle-orm";

export async function getAreasVentas(): Promise<{
  data: AreaVenta[] | null;
  error: string | null;
}> {
  try {
    const areas = await db
      .select({
        id: inventarioAreaventa.id,
        nombre: inventarioAreaventa.nombre,
        color: inventarioAreaventa.color,
        isMesa: inventarioAreaventa.isMesa,
      })
      .from(inventarioAreaventa)
      .where(eq(inventarioAreaventa.active, true))
      .orderBy(desc(inventarioAreaventa.id));
    return {
      data: areas,
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al obtener las áreas de venta.",
    };
  }
}
