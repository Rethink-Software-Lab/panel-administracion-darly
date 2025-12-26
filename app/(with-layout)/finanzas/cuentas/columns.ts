"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Tarjetas } from "../types";

export const columns: ColumnDef<Tarjetas>[] = [
  {
    accessorKey: "tipo",
    header: "Tipo",
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "saldo",
    header: "Saldo",
    cell: ({ row }) =>
      Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: row.original.moneda,
        currencyDisplay: "code",
      }).format(Number(row.original.saldo)),
  },
];
