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
import { useQueryState } from "nuqs";
import { TipoTransferencia } from "@/app/(with-layout)/cuentas/types";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function FiltersTransacciones() {
  const [type, setType] = useQueryState("type", { shallow: false });

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
  return (
    <div className="flex gap-2 overflow-x-auto mb-2">
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
  );
}
