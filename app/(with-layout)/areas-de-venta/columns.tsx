"use client";
import TableDeleteV2 from "@/components/functionals/TableDeleteV2";
import { deleteAreaVenta } from "./actions";
import { ColumnDef } from "@tanstack/react-table";
import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModalAreasVenta from "@/components/functionals/ModalAreasVenta";
import { AreaVenta } from "./types";
import { AreaVentaTableMeta } from "@/components/functionals/data-tables/data-table-areas-ventas";

export const columns: ColumnDef<AreaVenta>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre",
  },

  {
    accessorKey: "color",
    header: "Color",
    cell: ({ row }) => (
      <div
        className="w-8 h-8 rounded-lg"
        style={{ background: row.getValue("color") }}
      ></div>
    ),
  },
  {
    accessorKey: "cuenta.nombre",
    header: "Cuenta",
  },

  {
    header: " ",
    cell: ({ row, table }) => {
      if (row.original.nombre !== "Revoltosa") {
        return (
          <div className="flex items-center justify-end gap-2">
            <ModalAreasVenta
              data={row.original}
              cuentasEfectivo={
                (table.options.meta as AreaVentaTableMeta)?.cuentasEfectivo ||
                []
              }
              trigger={
                <Button variant="outline" size="icon">
                  <span className="sr-only">Editar</span>
                  <Edit2 size={18} />
                </Button>
              }
            />
            <TableDeleteV2 id={row.original.id} action={deleteAreaVenta} />
          </div>
        );
      }
    },
  },
];
