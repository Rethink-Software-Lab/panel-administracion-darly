import {
  custom,
  forward,
  maxValue,
  minValue,
  nonEmpty,
  number,
  object,
  optional,
  partialCheck,
  pipe,
  string,
  transform,
} from "valibot";
import { FrecuenciasGastos, TiposGastos } from "./types";

export const GastosSchema = pipe(
  object({
    descripcion: pipe(
      string("La descripción es requerida."),
      nonEmpty("La descripción es requerida")
    ),
    cuenta: pipe(
      string("La cuenta es requerida."),
      nonEmpty("La cuenta es requerida.")
    ),
    area_venta: pipe(
      string("El área de destino es requerida."),
      nonEmpty("El área de destino es requerida")
    ),
    tipo: pipe(
      string("Tipo de gasto requerido."),
      nonEmpty("Tipo de gasto requerido.")
    ),
    frecuencia: optional(
      pipe(string("frecuencia requerido."), nonEmpty("frecuencia requerido."))
    ),
    cantidad: pipe(
      number("La cantidad es requerida"),
      minValue(1, "La cantidad debe ser mayor a 0")
    ),
    diaMes: optional(
      pipe(
        number("El día del mes es requerido."),
        minValue(1, "El día del mes debe ser mayor a 0."),
        maxValue(31, "El día del mes no debe ser mayor a 31.")
      )
    ),
    diaSemana: optional(
      pipe(
        string("Seleccione un dia de la semana"),
        nonEmpty("Seleccione un dia de la semana"),
        custom<string>((value) => {
          const parsedValue = parseInt(value as string, 10);
          return !isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 6;
        }, "Seleccione un dia de la semana")
      )
    ),
  }),
  forward(
    partialCheck(
      [["tipo"], ["frecuencia"]],
      (input) => {
        if (input.tipo === TiposGastos.FIJO && !input.frecuencia) {
          return false;
        }
        return true;
      },
      "La frecuencia es requerida en un gasto fijo."
    ),
    ["frecuencia"]
  ),
  forward(
    partialCheck(
      [["frecuencia"], ["diaMes"]],
      (input) => {
        if (input.frecuencia === FrecuenciasGastos.MENSUAL && !input.diaMes) {
          return false;
        }
        return true;
      },
      "El dia del mes es requerido."
    ),
    ["diaMes"]
  ),
  forward(
    partialCheck(
      [["frecuencia"], ["diaSemana"]],
      (input) => {
        if (
          input.frecuencia === FrecuenciasGastos.SEMANAL &&
          !input.diaSemana
        ) {
          return false;
        }
        return true;
      },
      "El dia de la semana es requerido."
    ),
    ["diaSemana"]
  )
);
