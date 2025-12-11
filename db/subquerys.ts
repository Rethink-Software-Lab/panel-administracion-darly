import { desc, eq } from "drizzle-orm";
import { db } from "./initial";
import {
  inventarioHistorialpreciocostocafeteria,
  inventarioHistorialpreciocostosalon,
  inventarioHistorialprecioventacafeteria,
  inventarioHistorialprecioventasalon,
  inventarioPrecioelaboracion,
} from "@/db/schema";
import { PgColumn } from "drizzle-orm/pg-core";

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
  productoId: number | PgColumn
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
  productoId: number | PgColumn
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

export const createSubqueryUltimoPrecioVentaProducto = (
  productoId: number | PgColumn
) =>
  db
    .select({
      precio: inventarioHistorialprecioventasalon.precio,
    })
    .from(inventarioHistorialprecioventasalon)
    .where(eq(inventarioHistorialprecioventasalon.productoInfoId, productoId))
    .orderBy(desc(inventarioHistorialprecioventasalon.id))
    .limit(1)
    .as("precioVenta");

export const createSubqueryUltimoPrecioCostoProducto = (
  productoId: number | PgColumn
) =>
  db
    .select({
      precio: inventarioHistorialpreciocostosalon.precio,
    })
    .from(inventarioHistorialpreciocostosalon)
    .where(eq(inventarioHistorialpreciocostosalon.productoInfoId, productoId))
    .orderBy(desc(inventarioHistorialpreciocostosalon.id))
    .limit(1)
    .as("precioCosto");
