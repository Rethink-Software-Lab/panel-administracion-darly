import { custom, nonEmpty, object, pipe, string } from "valibot";

export const AreaVentaSchema = object({
  nombre: pipe(
    string("Campo requerido."),
    nonEmpty("Campo requerido."),
    custom(
      (value) => value !== "Revoltosa",
      'El nombre no puede ser "Revoltosa"'
    )
  ),
  color: pipe(
    string("El color es requerido."),
    nonEmpty("El color es requerido.")
  ),
  cuenta: pipe(
    string("La cuenta es requerida."),
    nonEmpty("La cuenta es requerida.")
  ),
});
