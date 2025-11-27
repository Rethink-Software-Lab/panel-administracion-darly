import { enum_, nonEmpty, object, pipe, string } from "valibot";
import { TipoPrecio } from "./types";

export const HistorialPreciosSchema = object({
  tipo: enum_(TipoPrecio, "Tipo de precio requerido"),
  precio: pipe(string(), nonEmpty("El precio debe ser mayor a 0")),
});
