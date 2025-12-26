import {
  array,
  enum_,
  forward,
  maxLength,
  minLength,
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
import { METODOS_PAGO } from "./types";
import { TipoCuenta } from "../../finanzas/transacciones/types";

export const EntradaCafeteriaSchema = pipe(
  object({
    proveedor: optional(
      pipe(
        string("El proveedor es requerido"),
        nonEmpty("El proveedor es requerido")
      )
    ),
    proveedor_nombre: optional(
      pipe(
        string("El nombre del proveedor es requerido"),
        nonEmpty("El nombre del proveedor es requerido"),
        maxLength(100, "Máximo de 100 caracteres.")
      )
    ),
    proveedor_nit: optional(
      pipe(
        string("El NIT es requerido"),
        nonEmpty("El NIT es requerido"),
        maxLength(30, "Máximo de 30 caracteres.")
      )
    ),
    proveedor_telefono: optional(
      pipe(
        string("El telefono del proveedor es requerido"),
        nonEmpty("El telefono del proveedor es requerido"),
        maxLength(10, "Máximo de 10 caracteres.")
      )
    ),
    proveedor_direccion: optional(
      pipe(
        string("El domicilio social es requerido"),
        nonEmpty("El domicilio social es requerido"),
        maxLength(100, "Máximo de 100 caracteres.")
      )
    ),
    proveedor_no_cuenta_cup: optional(
      pipe(
        string("El número de cuenta en CUP debe ser una cadena de texto"),
        maxLength(30, "Máximo de 30 caracteres.")
      )
    ),
    proveedor_no_cuenta_mayorista: optional(
      pipe(
        string("El número de cuenta mayorista debe ser una cadena de texto"),
        maxLength(30, "Máximo de 30 caracteres.")
      )
    ),
    comprador: pipe(
      string("El comprador es requerido."),
      nonEmpty("El comprador es requerido.")
    ),
    cuentas: pipe(
      array(
        object({
          cuenta: pipe(
            string("La cuenta es requerida."),
            nonEmpty("La cuenta es requerida.")
          ),
          cantidad: optional(pipe(number(), minValue(1, "Valor mínimo 1"))),
          tipo: pipe(string(), nonEmpty("Tipo de cuenta requerido.")),
        })
      ),
      minLength(1, "Se requiere al menos una cuenta.")
    ),
    metodoPago: enum_(METODOS_PAGO, "Método de pago requerido."),
    productos: array(
      object({
        producto: pipe(
          string("El producto es requerido"),
          transform(Number),
          minValue(1, "El producto es requerido")
        ),
        cantidad: pipe(
          string("La cantidad es requerida"),
          transform(parseFloat),
          minValue(0.1, "La cantidad debe ser mayor que 0")
        ),
        importe: pipe(
          string("La cantidad es requerida"),
          transform(parseFloat),
          minValue(0, "El importe debe ser mayor que 0")
        ),
        precio_venta: optional(
          pipe(
            string("La cantidad es requerida"),
            transform(parseFloat),
            minValue(0, "El precio de venta debe ser mayor que 0")
          )
        ),
      })
    ),
  }),
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
  ),
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
