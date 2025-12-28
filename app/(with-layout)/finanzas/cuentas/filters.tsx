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
import SheetCuentas from "@/components/functionals/sheets/SheetTarjetas";

export function FiltersCuentas({ table }: { table: Table<Cuenta> }) {
  return (
    <div className="flex items-center justify-between pb-4">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="text-muted-foreground">
              {table.getState().columnFilters.find((f) => f.id === "tipo") ? (
                <span className="text-black flex items-center gap-1">
                  <Check size={16} />
                  {TipoCuenta[
                    table.getState().columnFilters.find((f) => f.id === "tipo")
                      ?.value as TipoCuenta
                  ] || "Tipo"}
                </span>
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
      <SheetCuentas />
    </div>
  );
}
