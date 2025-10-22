"use client";
import TableDeleteV2 from "@/components/functionals/TableDeleteV2";
import { deleteTransferenciaTarjeta } from "./actions";
import { DateTime } from "luxon";
import { ColumnDef } from "@tanstack/react-table";

import { TipoTransferencia, Transacciones } from "./types";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Coins,
  HardHat,
  LucideProps,
  SquareArrowDownLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

type TipoConfigItem = {
  name: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  className: string;
  tooltipClassName: string;
};

const tipoConfig: Record<TipoTransferencia, TipoConfigItem> = {
  [TipoTransferencia.INGRESO]: {
    name: "Ingreso",
    icon: ArrowDownLeft,
    className: "text-green-500",
    tooltipClassName: "bg-green-500",
  },
  [TipoTransferencia.EGRESO]: {
    name: "Egreso",
    icon: ArrowUpRight,
    className: "text-red-500",
    tooltipClassName: "bg-red-500",
  },
  [TipoTransferencia.ENTRADA]: {
    name: "Entrada",
    icon: SquareArrowDownLeft,
    className: "text-blue-500",
    tooltipClassName: "bg-blue-500",
  },
  [TipoTransferencia.PAGO_TRABAJADOR]: {
    name: "Pago trabajador",
    icon: HardHat,
    className: "text-amber-500",
    tooltipClassName: "bg-amber-500",
  },
  [TipoTransferencia.GASTO_FIJO]: {
    name: "Gasto fijo",
    icon: Banknote,
    className: "text-orange-500",
    tooltipClassName: "bg-orange-500",
  },
  [TipoTransferencia.GASTO_VARIABLE]: {
    name: "Gasto variable",
    icon: Coins,
    className: "text-pink-500",
    tooltipClassName: "bg-pink-500",
  },
  [TipoTransferencia.TRANSFERENCIA]: {
    name: "Transferencia",
    icon: ArrowRightLeft,
    className: "text-amber-400",
    tooltipClassName: "bg-amber-400",
  },
  [TipoTransferencia.VENTA]: {
    name: "Venta",
    icon: CircleDollarSign,
    className: "text-purple-500",
    tooltipClassName: "bg-purple-500",
  },
};

export const columns: ColumnDef<Transacciones>[] = [
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
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => {
      const tipo = row.getValue("tipo") as TipoTransferencia;

      const config = tipoConfig[tipo];

      if (!config) return null;

      const IconComponent = config.icon;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <IconComponent className={config.className} />
            </TooltipTrigger>
            <TooltipContent className={config.tooltipClassName}>
              {config.name}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "cantidad",
    header: "Valor",
    cell: ({ row }) =>
      Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "CUP",
      }).format(row.getValue("cantidad")),
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
    size: 700,
  },
  {
    accessorKey: "cuenta",
    header: "Cuenta",
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
    cell: ({ row }) => {
      if (row.original.canDelete) {
        return (
          <TableDeleteV2
            id={row.original.id}
            action={deleteTransferenciaTarjeta}
          />
        );
      }
      return;
    },
  },
];
