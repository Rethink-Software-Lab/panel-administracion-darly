import { METODOS_PAGO } from "@/app/(with-layout)/(almacen-cafeteria)/entradas-cafeteria/types";
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsStringLiteral,
} from "nuqs/server";

export const searchParams = {
  p: parseAsInteger.withDefault(1),
  l: parseAsInteger.withDefault(50),
  from: parseAsIsoDateTime,
  to: parseAsIsoDateTime,
  met: parseAsStringLiteral(Object.entries(METODOS_PAGO).map(([k]) => k)),
  productos: parseAsArrayOf(parseAsInteger),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
