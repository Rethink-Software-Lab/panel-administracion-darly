import {
  enum_,
  minValue,
  nonEmpty,
  transform,
  object,
  pipe,
  string,
  forward,
  partialCheck,
  optional,
} from "valibot";
import { TipoTransferencia } from "@/app/(with-layout)/finanzas/transacciones/types";
import { Cuenta } from "../transacciones/types";

export const TransferenciasTarjetas = object({
  cuenta: pipe(
    string("La tarjeta es requerida."),
    nonEmpty("La tarjeta es requerida.")
  ),
  cantidad: pipe(
    string("El valor es requerido"),
    nonEmpty("El valor es requerido"),
    transform((value: string) => {
      const normalized = value.replace(/,/g, ".").trim();
      const parsed = parseFloat(normalized);
      if (!isFinite(parsed)) {
        throw new Error("Formato inválido: ingrese un número válido.");
      }
      const rounded = Math.round(parsed * 100) / 100;
      return rounded;
    }),
    minValue(0.01, "El valor debe ser mayor que 0")
  ),
  descripcion: pipe(
    string("La descripción es requerida."),
    nonEmpty("La descripción es requerida.")
  ),
  tipo: enum_(TipoTransferencia, "El tipo de la transferencia es requerido."),
});

export const TransferenciaSchema = pipe(
  object({
    cuentaOrigen: pipe(
      string("La cuenta origen es requerida."),
      nonEmpty("La cuenta origen es requerida."),
      transform((value: string) => parseInt(value)),
      minValue(1, "La cuenta origen es requerida.")
    ),
    cuentaDestino: pipe(
      string("La cuenta destino es requerida."),
      nonEmpty("La cuenta destino es requerida."),
      transform((value: string) => parseInt(value)),
      minValue(1, "La cuenta destino es requerida.")
    ),
    descripcion: string(),
    cantidad: pipe(
      string("La cantidad es requerida."),
      nonEmpty("La cantidad es requerida."),
      transform((value: string) => {
        const normalized = value.replace(/,/g, ".").trim();
        const parsed = parseFloat(normalized);
        if (!isFinite(parsed)) {
          throw new Error("Formato inválido: ingrese un número válido.");
        }
        return parsed;
      }),
      minValue(0.1, "La cantidad debe ser mayor que 0")
    ),
    tipoCambio: optional(
      pipe(
        string("El tipo de cambio es requerido."),
        nonEmpty("El tipo de cambio es requerido."),
        transform((value: string) => parseFloat(value)),
        minValue(0.1, "El tipo de cambio debe ser mayor que 0")
      )
    ),
  }),
  forward(
    partialCheck(
      [["cuentaOrigen"], ["cuentaDestino"]],
      (input) => {
        if (input.cuentaOrigen === input.cuentaDestino) {
          return false;
        }
        return true;
      },
      "Las cuentas origen y destino no pueden ser iguales."
    ),
    ["cuentaDestino"]
  )
);

export const createTransferenciaSchema = (cuentas: Cuenta[]) =>
  pipe(
    object({
      cuentaOrigen: pipe(
        string("La cuenta origen es requerida."),
        nonEmpty("La cuenta origen es requerida."),
        transform((value: string) => parseInt(value)),
        minValue(1, "La cuenta origen es requerida.")
      ),
      cuentaDestino: pipe(
        string("La cuenta destino es requerida."),
        nonEmpty("La cuenta destino es requerida."),
        transform((value: string) => parseInt(value)),
        minValue(1, "La cuenta destino es requerida.")
      ),
      descripcion: string(),
      cantidad: pipe(
        string("La cantidad es requerida."),
        nonEmpty("La cantidad es requerida."),
        transform(Number),
        minValue(0.01, "La cantidad debe ser mayor que 0")
      ),
      tipoCambio: optional(
        pipe(
          string(),
          transform(Number),
          minValue(0.01, "El tipo de cambio debe ser mayor que 0")
        )
      ),
    }),
    forward(
      partialCheck(
        [["cuentaOrigen"], ["cuentaDestino"]],
        (input) => input.cuentaOrigen !== input.cuentaDestino,
        "Las cuentas origen y destino no pueden ser iguales."
      ),
      ["cuentaDestino"]
    ),
    forward(
      partialCheck(
        [["cuentaOrigen"], ["cuentaDestino"], ["tipoCambio"]],
        (input) => {
          if (!input.cuentaOrigen || !input.cuentaDestino) return true;

          const cuentaOrigen = cuentas.find((c) => c.id === input.cuentaOrigen);
          const cuentaDestino = cuentas.find(
            (c) => c.id === input.cuentaDestino
          );

          if (!cuentaOrigen || !cuentaDestino) return true;

          if (cuentaOrigen.moneda !== cuentaDestino.moneda) {
            if (typeof input.tipoCambio !== "number" || input.tipoCambio <= 0) {
              return false;
            }
          }

          return true;
        },
        "El tipo de cambio es requerido cuando las monedas son diferentes."
      ),
      ["tipoCambio"]
    )
  );

export type TransferenciaSchemaType = ReturnType<
  typeof createTransferenciaSchema
>;
