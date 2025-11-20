"use client";
import { ColumnDef } from "@tanstack/react-table";
import { ProductoCafeteria } from "./types";

export const columns: ColumnDef<ProductoCafeteria>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "cantidad",
    header: "Cantidad",
    cell: ({ row }) =>
      Intl.NumberFormat("es-ES", {
        maximumFractionDigits: 10,
      }).format(row.original.cantidad),
  },
  {
    accessorKey: "precioVenta",
    header: "Precio de venta",
    cell: ({ row }) =>
      Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "CUP",
      }).format(row.getValue("precioVenta")),
  },
];
