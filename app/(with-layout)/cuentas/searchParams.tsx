import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsStringLiteral,
  parseAsIsoDateTime,
  parseAsArrayOf,
} from "nuqs/server";
import { TipoTransferencia } from "./types";

export const cuentasSearchParams = {
  c: parseAsInteger,
  d: parseAsStringLiteral(["next", "prev"]),
  l: parseAsInteger.withDefault(10),
  from: parseAsIsoDateTime,
  to: parseAsIsoDateTime,
  type: parseAsStringLiteral([
    TipoTransferencia.INGRESO,
    TipoTransferencia.EGRESO,
  ]),
  accounts: parseAsArrayOf(parseAsInteger),
};

export const searchParamsCache = createSearchParamsCache(cuentasSearchParams);
