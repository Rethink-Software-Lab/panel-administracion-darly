"use client";

import { Badge } from "@/components/ui/badge";
import TableDeleteV2 from "@/components/functionals/TableDeleteV2";
import { DateTime } from "luxon";
import { deleteVenta } from "./actions";
import { ColumnDef } from "@tanstack/react-table";
import { canDeleteVenta } from "@/lib/utils";
import { Venta } from "./types";
import { VentaAreaVentaTableMeta } from "./data-table";

export const columns: ColumnDef<Venta>[] = [
  {
    accessorKey: "createdAt",
    header: "Fecha",
    cell: ({ row }) =>
      DateTime.fromSQL(row.getValue("createdAt")).toLocaleString(
        DateTime.DATETIME_MED,
        { locale: "es" }
      ),
  },
  {
    accessorKey: "descripcion",
    header: "Producto",
    size: 700,
  },
  {
    accessorKey: "cantidad",
    header: "Cantidad",
  },
  {
    accessorKey: "importe",
    header: "Importe",
    cell: ({ row }) =>
      Intl.NumberFormat("es-ES", { style: "currency", currency: "CUP" }).format(
        row.getValue("importe")
      ),
  },
  {
    accessorKey: "metodoPago",
    header: "Método de pago",
    cell: ({ row }) => {
      return <Badge variant="outline">{row.getValue("metodoPago")}</Badge>;
    },
  },
  {
    accessorKey: "username",
    header: "Usuario",
    cell: ({ row }) => {
      const username = row.original.usuario.username;
      if (username) {
        return username;
      } else {
        return <Badge variant="outline">Usuario eliminado</Badge>;
      }
    },
  },
  {
    header: " ",
    cell: ({ row, table }) => (
      <TableDeleteV2
        id={row.original.id}
        action={deleteVenta}
        disabled={
          !canDeleteVenta(
            (table.options.meta as VentaAreaVentaTableMeta)?.userId,
            row.original.usuario.id,
            (table.options.meta as VentaAreaVentaTableMeta)?.isStaff
          )
        }
      />
    ),
  },
];
