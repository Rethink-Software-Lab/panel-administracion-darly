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
} from "valibot";
import { Banco, TipoTransferencia } from "./types";

export const TarjetasSchema = object({
  nombre: pipe(
    string("El nombre es requerido"),
    nonEmpty("El nombre es requerido")
  ),
  banco: enum_(Banco, "Banco requerido."),
  saldo_inicial: pipe(
    string("El saldo inicial es requerido"),
    nonEmpty("El saldo inicial es requerido")
  ),
});

export const TransferenciasTarjetas = object({
  cuenta: pipe(
    string("La tarjeta es requerida."),
    nonEmpty("La tarjeta es requerida.")
  ),
  cantidad: pipe(
    string("El valor es requerido"),
    nonEmpty("El valor es requerido")
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
    cantidad: pipe(
      string("La cantidad es requerida."),
      nonEmpty("La cantidad es requerida."),
      transform((value: string) => parseFloat(value)),
      minValue(0.1, "La cantidad debe ser mayor que 0")
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
