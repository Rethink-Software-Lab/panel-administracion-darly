"use client";

import TableDeleteV2 from "@/components/functionals/TableDeleteV2";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Gasto } from "./types";
import { deleteGasto } from "@/app/(with-layout)/gastos/actions";
import { Badge } from "@/components/ui/badge";
import SheetGastos from "@/components/functionals/sheets/SheetGastos";
import { CustomTableOptions } from "@/components/functionals/data-tables/data-table-gastos";

const DiasSemana: { [key: number]: string } = {
  0: "Lunes",
  1: "Martes",
  2: "Miércoles",
  3: "Jueves",
  4: "Viernes",
  5: "Sábado",
  6: "Domingo",
};

export const columns: ColumnDef<Gasto>[] = [
  {
    accessorKey: "descripcion",
    header: "Descripción",
    size: 700,
  },
  { accessorKey: "cuenta.nombre", header: "Cuenta" },
  {
    header: "Áreas de venta",
    cell: ({ row }: { row: Row<Gasto> }) => {
      const areas = row.original.areas_venta;
      const is_cafeteria = row.original.is_cafeteria;
      const isGeneral = row.original.isGeneral;
      if (areas && areas.length > 0) {
        return areas.map((area) => area.nombre).join(", ");
      } else {
        if (is_cafeteria) {
          return "Cafetería";
        }
        if (isGeneral) {
          return "General";
        }
      }
    },
  },

  {
    accessorKey: "frecuencia",
    header: "Frecuencia",
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("frecuencia")}</Badge>
    ),
  },
  {
    header: "Día",
    cell: ({ row }) =>
      row.original.diaMes ||
      (row.original.diaSemana && DiasSemana[row.original.diaSemana]) ||
      " - ",
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
    cell: ({ row }: { row: Row<Gasto> }) => {
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
      const areas = (table.options as CustomTableOptions<Gasto>).meta.areas;
      const cuentas = (table.options as CustomTableOptions<Gasto>).meta.cuentas;

      return (
        <span className="space-x-2">
          <SheetGastos
            areas={areas || []}
            cuentas={cuentas || []}
            data={row.original}
          />
          <TableDeleteV2 id={row.original.id} action={deleteGasto} />
        </span>
      );
    },
  },
];
