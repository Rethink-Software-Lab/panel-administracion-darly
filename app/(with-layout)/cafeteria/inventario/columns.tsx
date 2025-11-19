"use client";
import { ColumnDef } from "@tanstack/react-table";
import { ProductoCafeteria } from "../types";

export const columns: ColumnDef<ProductoCafeteria>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "cantidad",
    header: "Cantidad",
  },
  {
    accessorKey: "precioVenta",
    header: "Precio de venta",
    cell: ({ row }) =>
      Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "CUP",
        currencyDisplay: "code",
        maximumFractionDigits: 10,
      }).format(row.getValue("precioVenta")),
  },
];
