"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  TableOptions,
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
import { parseAsInteger, useQueryStates } from "nuqs";
import {
  Productos_Elaboraciones,
  TarjetasVentas,
  VentasCafeteria,
} from "../types";

export interface VentasCafeteriaTableMeta extends TableMeta<VentasCafeteria> {
  productos_elaboraciones: Productos_Elaboraciones[];
  cuentasBancarias: TarjetasVentas[];
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  meta: {
    totalCount: number;
    pageCount: number;
  };
  productos_elaboraciones: Productos_Elaboraciones[];
  cuentasBancarias: TarjetasVentas[];
}

export default function DataTableTransacciones<TData>({
  columns,
  data,
  meta,
  productos_elaboraciones,
  cuentasBancarias,
}: DataTableProps<TData>) {
  const [queryState, setQueryState] = useQueryStates(
    {
      p: parseAsInteger.withDefault(1),
      l: parseAsInteger.withDefault(10),
    },
    { shallow: false }
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: meta.pageCount,
    rowCount: meta.totalCount,

    meta: {
      productos_elaboraciones,
      cuentasBancarias,
    } as VentasCafeteriaTableMeta,

    state: {
      pagination: {
        pageIndex: queryState.p - 1,
        pageSize: Math.min(queryState.l, 100),
      },
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
  } as TableOptions<VentasCafeteria>);

  return (
    <div className="">
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
