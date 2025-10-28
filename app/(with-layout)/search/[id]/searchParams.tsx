import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsArrayOf,
  parseAsBoolean,
} from "nuqs/server";

export const searchSearchParams = {
  id: parseAsInteger,
  isCafeteria: parseAsBoolean.withDefault(false),
  n: parseAsArrayOf(parseAsInteger),
};

export const searchParamsCache = createSearchParamsCache(searchSearchParams);
