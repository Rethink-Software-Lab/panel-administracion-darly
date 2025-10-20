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
import { Tarjetas, Transacciones } from "@/app/(with-layout)/cuentas/types";
import { FiltersTransacciones } from "./filters";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { useMemo } from "react";
import { DateRange } from "react-day-picker";

export interface TransaccionesTableMeta extends TableMeta<Transacciones> {
  cuentas: Tarjetas[];
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  meta: {
    totalCount: number;
    pageCount: number;
  };
  cuentas: Tarjetas[];
}

export default function DataTableTransacciones<TData>({
  columns,
  data,
  meta,
  cuentas,
}: DataTableProps<TData>) {
  const [queryState, setQueryState] = useQueryStates(
    {
      p: parseAsInteger.withDefault(1),
      l: parseAsInteger.withDefault(10),
      type: parseAsString,
      accounts: parseAsArrayOf(parseAsInteger),
      from: parseAsIsoDateTime,
      to: parseAsIsoDateTime,
    },
    { shallow: false }
  );

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    if (queryState.type) {
      filters.push({ id: "tipo", value: queryState.type });
    }
    if (queryState.accounts) {
      filters.push({ id: "cuenta", value: queryState.accounts });
    }
    if (queryState.from || queryState.to) {
      filters.push({
        id: "createdAt",
        value: { from: queryState.from, to: queryState.to },
      });
    }
    return filters;
  }, [queryState.type, queryState.accounts, queryState.from, queryState.to]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: meta.pageCount,
    rowCount: meta.totalCount,

    meta: {
      cuentas,
    } as TransaccionesTableMeta,

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

      const typeFilter = newFilters.find((f) => f.id === "tipo");
      const newTypeValue =
        typeFilter && typeof typeFilter.value === "string"
          ? typeFilter.value
          : null;

      const accountsFilter = newFilters.find((f) => f.id === "cuenta");
      const newAccountsValue =
        accountsFilter && Array.isArray(accountsFilter.value)
          ? (accountsFilter.value as number[])
          : null;

      const dateRangeFilter = newFilters.find((f) => f.id === "createdAt");
      const newDateRangeValue =
        dateRangeFilter &&
        typeof dateRangeFilter.value === "object" &&
        dateRangeFilter.value !== null
          ? (dateRangeFilter.value as DateRange)
          : { from: null, to: null };

      setQueryState({
        type: newTypeValue,
        accounts: newAccountsValue,
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
  } as TableOptions<Transacciones>);

  return (
    <div className="">
      <FiltersTransacciones table={table} />
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
