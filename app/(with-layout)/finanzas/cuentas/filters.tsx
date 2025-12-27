import { Input } from "@/components/ui/input";
import { Table } from "@tanstack/react-table";
import { Cuenta } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { TipoCuenta } from "../transacciones/types";

const Tipos = [
  {
    EFECTIVO: "Efectivo",
  },
];

export function FiltersCuentas({ table }: { table: Table<Cuenta> }) {
  return (
    <div className="flex items-center justify-between pt-2 pb-4 gap-4">
      <div className="flex gap-2">
        <Input
          className="max-w-60"
          value={
            (table.getState().columnFilters?.find((el) => el.id === "nombre")
              ?.value as string) || ""
          }
          onChange={(e) =>
            table.setColumnFilters((prevState) => {
              const has = prevState?.find((el) => el.id === "nombre");
              if (!has) {
                return prevState.concat({
                  id: "nombre",
                  value: e.target.value,
                });
              }
              return prevState
                .filter((f) => f.id !== "nombre")
                .concat({
                  id: "nombre",
                  value: e.target.value,
                });
            })
          }
          placeholder="Filtrar por nombre"
        />
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto flex gap-1">
              {table.getState().columnFilters.find((f) => f.id === "tipo") ? (
                <>
                  <Check size={16} />
                  {TipoCuenta[
                    table.getState().columnFilters.find((f) => f.id === "tipo")
                      ?.value as TipoCuenta
                  ] || "Tipo"}
                </>
              ) : (
                "Tipo"
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[300px]">
            <DropdownMenuRadioGroup
              value={
                (table.getState().columnFilters?.find((el) => el.id === "tipo")
                  ?.value as string) || ""
              }
              onValueChange={(value) =>
                table.setColumnFilters((prevState) => {
                  const has = prevState?.find((el) => el.id === "tipo");
                  if (!has) {
                    return prevState.concat({ id: "tipo", value });
                  }
                  if (has.value === value) {
                    return prevState.filter((f) => f.id !== "tipo");
                  } else {
                    return prevState
                      .filter((f) => f.id !== "tipo")
                      .concat({ id: "tipo", value });
                  }
                })
              }
            >
              {Object.keys(TipoCuenta).map((tipo) => (
                <DropdownMenuRadioItem key={tipo} value={tipo}>
                  {TipoCuenta[tipo as TipoCuenta]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
