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
    accessorKey: "area_venta.nombre",
    header: "Área de venta",
    cell: ({ row }) => {
      const area = row.original.area_venta?.nombre;
      const is_cafeteria = row.original.is_cafeteria;
      if (area) {
        return area;
      } else if (!area && is_cafeteria) {
        return "Cafetería";
      } else {
        return <Badge variant="outline">Área de venta eliminada</Badge>;
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
      Intl.NumberFormat("es-CU", {
        style: "currency",
        currency: "CUP",
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
