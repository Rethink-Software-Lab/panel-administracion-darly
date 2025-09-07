"use client";
import { Button } from "@/components/ui/button";
import { DateRangePickerServer } from "../../date-range-picker-server";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseAsArrayOf, parseAsInteger, useQueryState } from "nuqs";
import { Tarjetas, TipoTransferencia } from "@/app/(with-layout)/cuentas/types";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import MultipleSelector from "@/components/ui/multiselect";
import { type Option } from "@/components/ui/multiselect";

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
};

export function FiltersTransacciones({ cuentas }: { cuentas: Tarjetas[] }) {
  const [type, setType] = useQueryState("type", { shallow: false });
  const [selectedAccounts, setSelectedAccounts] = useQueryState(
    "accounts",
    parseAsArrayOf(parseAsInteger)
  );

  const handleTypeChange = (value: string) => {
    if (!type) {
      setType(value);
    } else {
      if (type === value) {
        setType(null);
      } else {
        setType(value);
      }
    }
  };
  const onChangeAccounts = (value: Option[]) => {
    if (value.length === 0) {
      setSelectedAccounts(null, { shallow: false });
    } else {
      setSelectedAccounts(
        value.map((cuenta) => parseInt(cuenta.value)),
        { shallow: false }
      );
    }
  };
  return (
    <div className="md:flex gap-2 space-y-2 md:space-y-0 mb-2 justify-between">
      <div className="flex gap-2">
        <DateRangePickerServer />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ring-0 focus-visible:ring-0">
              {type ? (
                <span className="flex gap-1 items-center">
                  {(() => {
                    const {
                      icon: Icon,
                      color,
                      label,
                    } = tipoConfig[type as TipoTransferencia];
                    return (
                      <>
                        <Icon className={cn("size-6", color)} />
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
            >
              <DropdownMenuRadioItem
                value={TipoTransferencia.INGRESO}
                className="flex items-center gap-1"
              >
                <ArrowDownLeft className="size-6 text-green-500" />
                Ingreso
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value={TipoTransferencia.EGRESO}
                className="flex items-center gap-1"
              >
                <ArrowUpRight className="size-6 text-red-500" />
                Egreso
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <MultipleSelector
        commandProps={{
          label: "Seleccione cuentas",
          className: "w-72",
        }}
        value={
          selectedAccounts?.map((cuenta) => ({
            label:
              cuentas.find((c) => c.id.toString() === cuenta.toString())
                ?.nombre ?? "",
            value: cuenta.toString(),
          })) ?? undefined
        }
        defaultOptions={cuentas.map((cuenta) => ({
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
    </div>
  );
}
