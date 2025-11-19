import { createSearchParamsCache, parseAsInteger } from "nuqs/server";

export const cuentasSearchParams = {
  p: parseAsInteger.withDefault(1),
  l: parseAsInteger.withDefault(50),
};

export const searchParamsCache = createSearchParamsCache(cuentasSearchParams);
