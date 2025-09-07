"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  TableOptions,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePaginatonCursor } from "../../data-table-pagination-server-cursor";
import { Tarjetas, Transacciones } from "@/app/(with-layout)/cuentas/types";
import { FiltersTransacciones } from "./filters";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  nextCursor: number | null;
  prevCursor: number | null;
  pageCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  cuentas: Tarjetas[];
}

export default function DataTableTransacciones<TData>({
  columns,
  data,
  nextCursor,
  prevCursor,
  pageCount,
  hasNext,
  hasPrev,
  cuentas,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount,
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
    },
    defaultColumn: {
      minSize: 5,
    },
  } as TableOptions<Transacciones>);

  return (
    <div className="p-2 rounded-md border bg-white">
      <FiltersTransacciones cuentas={cuentas} />
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    className="whitespace-nowrap"
                    style={{ maxWidth: `${header.column.getSize()}px` }}
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
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
                    className="whitespace-nowrap"
                    style={{ maxWidth: `${cell.column.getSize()}px` }}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Sin resultados que mostrar.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePaginatonCursor
        table={table}
        nextCursor={nextCursor}
        prevCursor={prevCursor}
        hasNext={hasNext}
        hasPrev={hasPrev}
      />
    </div>
  );
}
