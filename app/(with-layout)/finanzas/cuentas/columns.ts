"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Cuenta } from "./types";

export const columns: ColumnDef<Cuenta>[] = [
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
