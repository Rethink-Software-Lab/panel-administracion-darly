import { desc, eq } from "drizzle-orm";
import { db } from "./initial";
import {
  inventarioHistorialpreciocostocafeteria,
  inventarioHistorialprecioventacafeteria,
  inventarioPrecioelaboracion,
} from "./schema";

export const createSubqueryUltimoPrecioElaboracion = (productoId: number) =>
  db
    .select({
      precio: inventarioPrecioelaboracion.precio,
    })
    .from(inventarioPrecioelaboracion)
    .where(eq(inventarioPrecioelaboracion.elaboracionId, productoId))
    .orderBy(desc(inventarioPrecioelaboracion.id))
    .limit(1)
    .as("precioElaboracion");

export const createSubqueryUltimoPrecioVentaProductoCafeteria = (
  productoId: number
) =>
  db
    .select({
      precio: inventarioHistorialprecioventacafeteria.precio,
    })
    .from(inventarioHistorialprecioventacafeteria)
    .where(eq(inventarioHistorialprecioventacafeteria.productoId, productoId))
    .orderBy(desc(inventarioHistorialprecioventacafeteria.id))
    .limit(1)
    .as("precioVenta");

export const createSubqueryUltimoPrecioCostoProductoCafeteria = (
  productoId: number
) =>
  db
    .select({
      precio: inventarioHistorialpreciocostocafeteria.precio,
    })
    .from(inventarioHistorialpreciocostocafeteria)
    .where(eq(inventarioHistorialpreciocostocafeteria.productoId, productoId))
    .orderBy(desc(inventarioHistorialpreciocostocafeteria.id))
    .limit(1)
    .as("precioCosto");
