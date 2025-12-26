import {
  array,
  boolean,
  enum_,
  forward,
  integer,
  maxValue,
  minLength,
  minValue,
  nonEmpty,
  number,
  object,
  optional,
  partialCheck,
  pipe,
  string,
} from "valibot";
import { METODOS_PAGO } from "@/app/(with-layout)/(almacen-cafeteria)/entradas-cafeteria/types";
import { TipoCuenta } from "@/app/(with-layout)/finanzas/transacciones/types";

export const VentasSchema = pipe(
  object({
    metodoPago: enum_(
      METODOS_PAGO,
      "Método requerido: Efectivo o transferencia"
    ),

    cuentas: pipe(
      array(
        object({
          cuenta: pipe(
            string("La cuenta es requerida."),
            nonEmpty("La cuenta es requerida.")
          ),
          cantidad: optional(
            pipe(
              number(),
              minValue(1, "Valor mínimo 1"),
              maxValue(100000, "Valor máximo 100.000")
            )
          ),
          tipo: pipe(string(), nonEmpty("Tipo de cuenta requerido.")),
        })
      ),
      minLength(1, "Se requiere al menos una cuenta.")
    ),

    zapatos_id: optional(
      pipe(
        array(
          object({
            id: string(),
            text: pipe(number(), integer(), minValue(1)),
          }),
          "Los ids de los zapatos son requeridos"
        ),
        minLength(1, "Los ids de los zapatos son requeridos")
      )
    ),
    cantidad: optional(pipe(number(), integer(), minValue(1))),
    producto_info: object(
      {
        id: pipe(
          number("El producto es requerido."),
          minValue(1, "El producto es requerido.")
        ),
        isZapato: boolean(),
      },
      "El producto es requerido."
    ),
  }),
  forward(
    partialCheck(
      ["cuentas"] as any[],
      (input) => {
        const cuentas = input.cuentas.map((p) => p.cuenta);
        const cuentasUnicas = new Set(cuentas);
        if (cuentas.length !== cuentasUnicas.size) {
          return false;
        }

        return true;
      },
      "No pueden haber cuentas duplicadas"
    ),
    ["cuentas"]
  ),
  forward(
    partialCheck(
      ["metodoPago", "cuentas"] as any[],
      (input) => {
        if (input.metodoPago !== METODOS_PAGO.MIXTO) return true;
        if (input.metodoPago === METODOS_PAGO.MIXTO && input.cuentas.length < 2)
          return false;

        const tipos = input.cuentas.map((c) => c.tipo);
        const tieneEfectivo = tipos.includes(TipoCuenta.EFECTIVO);
        const tieneBancaria = tipos.includes(TipoCuenta.BANCARIA);

        return tieneEfectivo && tieneBancaria;
      },
      "En pagos mixtos debe existir al menos 2 cuentas, de tipo efectivo y bancaria"
    ),
    ["cuentas"]
  )
);
