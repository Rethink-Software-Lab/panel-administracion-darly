import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  parseAsInteger,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { Table } from "@tanstack/react-table";
import { Transacciones } from "@/app/(with-layout)/cuentas/types";

export function DataTablePaginatonCursor({
  table,
  nextCursor,
  prevCursor,
  hasNext,
  hasPrev,
}: {
  table: Table<Transacciones>;
  nextCursor: number | null;
  prevCursor: number | null;
  hasNext: boolean;
  hasPrev: boolean;
}) {
  const [_, setNavigation] = useQueryStates(
    { c: parseAsInteger, d: parseAsStringLiteral(["next", "prev"]) },
    { shallow: false }
  );
  const [limit, setLimit] = useQueryState("l", {
    defaultValue: "10",
    shallow: false,
  });
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex  whitespace-nowrap items-center justify-center text-sm font-medium">
        {table.getPageCount()} páginas
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="hidden md:flex text-sm font-medium whitespace-nowrap">
            Filas por página
          </p>
          <Select
            value={limit}
            onValueChange={(value) => {
              setLimit(value);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 15, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setNavigation({ c: prevCursor, d: "prev" })}
            disabled={!hasPrev}
          >
            <span className="sr-only">Ir a la página anterior</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setNavigation({ c: nextCursor, d: "next" })}
            disabled={!hasNext}
          >
            <span className="sr-only">Ir a la siguiente página</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
