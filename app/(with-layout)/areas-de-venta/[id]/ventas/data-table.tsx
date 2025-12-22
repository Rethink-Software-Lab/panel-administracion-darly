"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  TableOptions,
  ColumnFiltersState,
  TableMeta,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "@/components/functionals/data-table-pagination-server-cursor";
import { FiltersVentasAreasVenta } from "./filters";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { useMemo } from "react";
import { DateRange } from "react-day-picker";
import { METODOS_PAGO } from "@/app/(with-layout)/(almacen-cafeteria)/entradas-cafeteria/types";
import { Producto, Venta } from "./types";

export interface VentaAreaVentaTableMeta extends TableMeta<Venta> {
  productos: Producto[];
  userId: number;
  isStaff: boolean;
}

interface DataTableProps {
  columns: ColumnDef<Venta>[];
  data: Venta[];
  meta: {
    totalCount: number;
    pageCount: number;
  };
  productos: Producto[];
  userId: number;
  isStaff: boolean;
  children?: React.ReactNode;
}

export function DataTableVentasAreaVenta({
  columns,
  data,
  meta,
  productos,
  userId,
  isStaff,
  children,
}: DataTableProps) {
  const [queryState, setQueryState] = useQueryStates(
    {
      p: parseAsInteger.withDefault(1),
      l: parseAsInteger.withDefault(50),
      met: parseAsStringLiteral(Object.entries(METODOS_PAGO).map(([k]) => k)),
      productos: parseAsArrayOf(parseAsInteger),
      from: parseAsIsoDateTime,
      to: parseAsIsoDateTime,
    },
    { shallow: false }
  );

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    if (queryState.met) {
      filters.push({ id: "metodoPago", value: queryState.met });
    }
    if (queryState.productos) {
      filters.push({ id: "descripcion", value: queryState.productos });
    }
    if (queryState.from || queryState.to) {
      filters.push({
        id: "createdAt",
        value: { from: queryState.from, to: queryState.to },
      });
    }
    return filters;
  }, [queryState.met, queryState.productos, queryState.from, queryState.to]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: meta.pageCount,
    rowCount: meta.totalCount,

    meta: {
      productos,
      userId,
      isStaff,
    } as VentaAreaVentaTableMeta,

    state: {
      pagination: {
        pageIndex: queryState.p - 1,
        pageSize: Math.min(queryState.l, 50),
      },
      columnFilters,
    },

    onColumnFiltersChange: (updater) => {
      const newFilters =
        typeof updater === "function" ? updater(columnFilters) : updater;

      const metodoFilter = newFilters.find((f) => f.id === "metodoPago");
      const newMetodoValue =
        metodoFilter && typeof metodoFilter.value === "string"
          ? metodoFilter.value
          : null;

      const productosFilter = newFilters.find((f) => f.id === "descripcion");
      const newProductosValue =
        productosFilter && Array.isArray(productosFilter.value)
          ? (productosFilter.value as number[])
          : null;

      const dateRangeFilter = newFilters.find((f) => f.id === "createdAt");
      const newDateRangeValue =
        dateRangeFilter &&
        typeof dateRangeFilter.value === "object" &&
        dateRangeFilter.value !== null
          ? (dateRangeFilter.value as DateRange)
          : { from: null, to: null };

      setQueryState({
        met: newMetodoValue,
        productos: newProductosValue,
        from: newDateRangeValue.from ?? null,
        to: newDateRangeValue.to ?? null,
        p: 1,
      });
    },

    onPaginationChange: (updater) => {
      const newState =
        typeof updater === "function"
          ? updater({
              pageIndex: queryState.p - 1,
              pageSize: queryState.l,
            })
          : updater;

      setQueryState({
        p: newState.pageIndex + 1,
        l: newState.pageSize,
      });
    },

    defaultColumn: {
      minSize: 5,
    },
  } as TableOptions<Venta>);

  return (
    <div className="">
      <FiltersVentasAreasVenta table={table}>
        {children}
      </FiltersVentasAreasVenta>
      <div className="rounded-md border">
        <Table className="bg-white rounded-lg">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap"
                    style={{ maxWidth: `${header.column.getSize()}px` }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap"
                      style={{ maxWidth: `${cell.column.getSize()}px` }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Sin resultados que mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
