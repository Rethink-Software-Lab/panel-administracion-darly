"use client";

import TableDeleteV2 from "@/components/functionals/TableDeleteV2";
import { ColumnDef } from "@tanstack/react-table";
import { Gasto } from "./types";
import { DateTime } from "luxon";
import { deleteGasto } from "@/app/(with-layout)/gastos/actions";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<Gasto>[] = [
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }) =>
      DateTime.fromSQL(row.getValue("created_at")).toLocaleString(
        DateTime.DATETIME_MED,
        { locale: "es" }
      ),
  },
  { accessorKey: "cuenta.nombre", header: "Cuenta" },
  {
    header: "Áreas de venta",
    cell: ({ row }) => {
      const areas = row.original.areas_venta;
      const is_cafeteria = row.original.is_cafeteria;
      if (areas && areas.length > 0) {
        return areas.map((area) => area.nombre).join(", ");
      } else {
        if (is_cafeteria) {
          return "Cafetería";
        } else {
          return "General";
        }
      }
    },
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
    size: 700,
  },
  {
    accessorKey: "cantidad",
    header: "Monto",
    cell: ({ row }) =>
      Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "CUP",
        currencyDisplay: "code",
      }).format(row.getValue("cantidad")),
  },
  {
    accessorKey: "usuario",
    header: "Usuario",
    cell: ({ row }) => {
      const username = row.getValue("usuario");
      if (username) {
        return username;
      } else {
        return <Badge variant="outline">Usuario eliminado</Badge>;
      }
    },
  },
  {
    header: " ",
    cell: ({ row }) => (
      <TableDeleteV2 id={row.original.id} action={deleteGasto} />
    ),
  },
];
