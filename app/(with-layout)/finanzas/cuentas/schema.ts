import {
  enum_,
  literal,
  minValue,
  nonEmpty,
  object,
  optional,
  pipe,
  string,
  transform,
  undefined_,
  variant,
} from "valibot";
import { Banco, Moneda, TipoCuenta } from "../transacciones/types";

const BaseSchema = object({
  nombre: pipe(
    string("El nombre es requerido"),
    nonEmpty("El nombre es requerido")
  ),
  saldo_inicial: pipe(
    string("El saldo inicial es requerido"),
    nonEmpty("El saldo inicial es requerido"),
    transform((value: string) => parseFloat(value)),
    minValue(0, "El saldo inicial debe ser mayor que 0")
  ),
  moneda: enum_(Moneda, "Moneda requerida."),
});

const EfectivoSchema = object({
  ...BaseSchema.entries,
  tipo: literal(TipoCuenta.EFECTIVO),
  banco: optional(undefined_()),
});

const ZelleSchema = object({
  ...BaseSchema.entries,
  tipo: literal(TipoCuenta.ZELLE),
  banco: optional(undefined_()),
  moneda: optional(undefined_()),
});

const BancariaSchema = object({
  ...BaseSchema.entries,
  tipo: literal(TipoCuenta.BANCARIA),
  banco: enum_(Banco, "Banco requerido."),
});

export const CuentasSchema = variant(
  "tipo",
  [EfectivoSchema, ZelleSchema, BancariaSchema],
  "El tipo de cuenta es requerido."
);
