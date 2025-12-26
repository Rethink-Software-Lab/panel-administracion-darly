import {
  array,
  boolean,
  enum_,
  forward,
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
import { METODOS_PAGO } from "../../(almacen-cafeteria)/entradas-cafeteria/types";
import { TipoCuenta } from "../../finanzas/types";

export const VentasCafeteriaSchema = pipe(
  object({
    metodoPago: enum_(METODOS_PAGO, "El método de pago es requerido."),
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
    productos: array(
      object({
        producto: pipe(
          string("El producto es requerido."),
          nonEmpty("El producto es requerido.")
        ),
        cantidad: optional(
          pipe(string(), nonEmpty("La cantidad debe ser > 0"))
        ),
        isElaboracion: boolean(),
      })
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
  ),
  forward(
    partialCheck(
      ["productos"] as any[],
      (input) => {
        const productosIds = input.productos.map(
          (producto) => producto.producto
        );
        const uniqueProductos = new Set(productosIds);
        if (productosIds.length !== uniqueProductos.size) {
          return false;
        }
        return true;
      },
      "No se deben tener productos repetidos."
    ),
    ["productos"]
  )
);
