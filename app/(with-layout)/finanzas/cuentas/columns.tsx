"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Cuenta } from "./types";
import { Banco, TipoCuenta } from "../transacciones/types";
import { cn, MAX_TRANF_MES } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const getColor = (tipo: TipoCuenta, banco: Banco | null) => {
  switch (tipo) {
    case TipoCuenta.ZELLE:
      return "from-[#a0f] to-[#6534D1]";
    case TipoCuenta.EFECTIVO:
      return "from-blue-500 to-blue-700";
    case TipoCuenta.BANCARIA:
      return banco === Banco.BANDEC
        ? "from-[#6c0207] to-[#bc1f26]"
        : "from-[#1d6156] to-[#1d6156]";
  }
};

export const columns: ColumnDef<Cuenta>[] = [
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "size-6 rounded-full bg-gradient-to-tr",
            getColor(row.original.tipo, row.original.banco)
          )}
        ></div>
        <span className="m-0">{row.original.tipo}</span>
      </div>
    ),
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    header: "Transferencias realizadas",
    cell: ({ row }) => {
      if (row.original.tipo === TipoCuenta.BANCARIA) {
        return (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">
              {Intl.NumberFormat("es-ES", {
                maximumFractionDigits: 0,
              }).format(
                (row.original.total_transferencias_mes * 100) / MAX_TRANF_MES
              )}{" "}
              %
            </span>
            <Progress
              className={cn(
                (row.original.total_transferencias_mes * 100) / MAX_TRANF_MES >=
                  60 && "[&>div]:bg-yellow-400",
                (row.original.total_transferencias_mes * 100) / MAX_TRANF_MES >=
                  80 && "[&>div]:bg-red-600"
              )}
              value={
                (row.original.total_transferencias_mes * 100) / MAX_TRANF_MES
              }
            />
          </div>
        );
      }
    },
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
