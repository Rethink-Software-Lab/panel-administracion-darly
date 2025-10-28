import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsArrayOf,
} from "nuqs/server";

export const searchSearchParams = {
  n: parseAsArrayOf(parseAsInteger),
};

export const searchParamsCache = createSearchParamsCache(searchSearchParams);
