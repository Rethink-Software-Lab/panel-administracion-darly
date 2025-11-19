"use client";

import TableDeleteV2 from "@/components/functionals/TableDeleteV2";
import { deleteVentaCafeteria } from "./actions";
import { ColumnDef } from "@tanstack/react-table";
import { CustomTableOptions } from "@/components/functionals/data-tables/data-table-elaboraciones";
import { VentasCafeteria } from "../types";
import { DateTime } from "luxon";
import { Badge } from "@/components/ui/badge";
import SheetInfoVentasCafeteria from "@/components/functionals/sheets/SheetInfoVentasCafeteria";
import SheetVentasCafeteria from "@/components/functionals/sheets/SheetVentasCafeteria";
import { VentasCafeteriaTableMeta } from "./data-table";

export const columns: ColumnDef<VentasCafeteria>[] = [
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
    accessorKey: "metodoPago",
    header: "Método de pago",
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("metodoPago")}</Badge>
    ),
  },

  {
    accessorKey: "importe",
    header: "Importe",
    cell: ({ row }) =>
      Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "CUP",
        currencyDisplay: "code",
        maximumFractionDigits: 10,
      }).format(row.getValue("importe")),
  },
  {
    accessorKey: "usuario",
    header: "Usuario",
    cell: ({ row }) => {
      const username = row.original.usuario;
      if (username) {
        return username;
      } else {
        return <Badge variant="outline">Usuario eliminado</Badge>;
      }
    },
  },

  {
    header: " ",
    cell: ({ row, table }) => {
      const { productos_elaboraciones, cuentasBancarias } = table.options
        .meta as VentasCafeteriaTableMeta;

      return (
        <span className="space-x-2">
          <SheetInfoVentasCafeteria data={row.original} />
          <SheetVentasCafeteria
            productos={productos_elaboraciones}
            cuentasBancarias={cuentasBancarias}
            data={row.original}
          />
          <TableDeleteV2 id={row.original.id} action={deleteVentaCafeteria} />
        </span>
      );
    },
  },
];
