"use client";
import { Button } from "@/components/ui/button";
import { DateRangePickerFilter } from "@/components/functionals/date-range-picker-server";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  TipoTransferencia,
  TransaccionesSelect,
} from "@/app/(with-layout)/finanzas/transacciones/types";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Coins,
  HardHat,
  SquareArrowDownLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MultipleSelector from "@/components/ui/multiselect";
import { type Option } from "@/components/ui/multiselect";
import { Table } from "@tanstack/react-table";
import { TransaccionesTableMeta } from "../../../../app/(with-layout)/finanzas/transacciones/data-table";

const tipoConfig = {
  [TipoTransferencia.INGRESO]: {
    icon: ArrowDownLeft,
    color: "text-green-500",
    label: "Ingreso",
  },
  [TipoTransferencia.EGRESO]: {
    icon: ArrowUpRight,
    color: "text-red-500",
    label: "Egreso",
  },

  [TipoTransferencia.ENTRADA]: {
    label: "Entrada",
    icon: SquareArrowDownLeft,
    color: "text-blue-500",
  },
  [TipoTransferencia.PAGO_TRABAJADOR]: {
    label: "Pago trabajador",
    icon: HardHat,
    color: "text-amber-500",
  },
  [TipoTransferencia.GASTO_FIJO]: {
    label: "Gasto fijo",
    icon: Banknote,
    color: "text-orange-500",
  },
  [TipoTransferencia.GASTO_VARIABLE]: {
    label: "Gasto variable",
    icon: Coins,
    color: "text-pink-500",
  },
  [TipoTransferencia.TRANSFERENCIA]: {
    label: "Transferencia",
    icon: ArrowRightLeft,
    color: "text-amber-400",
  },
  [TipoTransferencia.VENTA]: {
    label: "Venta",
    icon: CircleDollarSign,
    color: "text-purple-500",
  },
};

export function FiltersTransacciones({
  table,
}: {
  table: Table<TransaccionesSelect>;
}) {
  const type = table.getColumn("tipo")?.getFilterValue() as
    | TipoTransferencia
    | undefined;
  const selectedAccounts = table.getColumn("cuenta")?.getFilterValue() as
    | number[]
    | undefined;
  const isFiltered = table.getState().columnFilters.length > 0;

  const handleTypeChange = (value: string) => {
    const currentType = table.getColumn("tipo")?.getFilterValue();
    const newType = currentType === value ? undefined : value;

    table.getColumn("tipo")?.setFilterValue(newType);
  };

  const onChangeAccounts = (value: Option[]) => {
    const newAccounts =
      value.length > 0 ? value.map((v) => parseInt(v.value)) : undefined;

    table.getColumn("cuenta")?.setFilterValue(newAccounts);
  };

  return (
    <div className="md:flex gap-2 space-y-2 md:space-y-0 mb-2">
      <div className="flex gap-2">
        <DateRangePickerFilter table={table} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="ring-0 focus-visible:ring-0 text-muted-foreground"
            >
              {type && tipoConfig[type] ? (
                <span className="flex gap-1 items-center">
                  {(() => {
                    const { icon: Icon, color, label } = tipoConfig[type];
                    return (
                      <>
                        <Icon className={cn("size-5", color)} />
                        {label}
                      </>
                    );
                  })()}
                </span>
              ) : (
                "Tipo"
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={type ?? undefined}
              onValueChange={handleTypeChange}
              className="[&>div]:cursor-pointer"
            >
              {Object.entries(tipoConfig).map(([enumValue, config]) => {
                const Icon = config.icon;
                return (
                  <DropdownMenuRadioItem
                    key={config.label}
                    value={enumValue}
                    className="flex items-center gap-2"
                  >
                    <Icon className={cn("size-5", config.color)} />
                    <span>{config.label}</span>
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <MultipleSelector
        commandProps={{
          label: "Seleccione cuentas",
          className: "w-72 bg-white cursor-pointer text-muted-foreground",
        }}
        value={
          selectedAccounts?.map((cuenta) => ({
            label:
              (
                (table.options.meta as TransaccionesTableMeta)?.cuentas ?? []
              ).find((c) => c.id === cuenta)?.nombre ?? "",
            value: cuenta.toString(),
          })) ?? []
        }
        defaultOptions={(
          (table.options.meta as TransaccionesTableMeta)?.cuentas ?? []
        ).map((cuenta) => ({
          label: cuenta.nombre,
          value: cuenta.id.toString(),
        }))}
        onChange={onChangeAccounts}
        placeholder="Seleccione cuentas"
        hideClearAllButton
        hidePlaceholderWhenSelected
        emptyIndicator={
          <p className="text-center text-sm">Sin resultados que mostrar</p>
        }
      />
      {isFiltered && (
        <Button
          onClick={() => table.resetColumnFilters()}
          variant="ghost"
          size="sm"
          className="h-10"
        >
          <X className="mr-2 h-4 w-4" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
