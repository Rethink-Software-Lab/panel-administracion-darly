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

import { X } from "lucide-react";
import MultipleSelector from "@/components/ui/multiselect";
import { type Option } from "@/components/ui/multiselect";
import { Table } from "@tanstack/react-table";
import { VentaAreaVentaTableMeta } from "./data-table";
import { METODOS_PAGO } from "@/app/(with-layout)/(almacen-cafeteria)/entradas-cafeteria/types";
import { Venta } from "./types";

export function FiltersVentasAreasVenta({
  table,
  children,
}: {
  table: Table<Venta>;
  children?: React.ReactNode;
}) {
  const metodoPago = table.getColumn("metodoPago")?.getFilterValue() as
    | METODOS_PAGO
    | undefined;
  const selectedProductos = table.getColumn("descripcion")?.getFilterValue() as
    | number[]
    | undefined;
  const isFiltered = table.getState().columnFilters.length > 0;

  const handleMetodoChange = (value: string) => {
    const currentMetodo = table.getColumn("metodoPago")?.getFilterValue();
    const newMetodo = currentMetodo === value ? undefined : value;

    table.getColumn("metodoPago")?.setFilterValue(newMetodo);
  };

  const onChangeProductos = (value: Option[]) => {
    const newProductos =
      value.length > 0
        ? value.map((v) => {
            const producto = (
              (table.options.meta as VentaAreaVentaTableMeta)?.productos ?? []
            ).find((p) => p.descripcion === v.value);
            return producto?.id ?? 0;
          })
        : undefined;

    table.getColumn("descripcion")?.setFilterValue(newProductos);
  };

  return (
    <div className="md:flex gap-2 space-y-2 md:space-y-0 mb-2 items-center justify-between">
      <div className="md:flex gap-2 max-md:space-y-2 w-full">
        <div className="flex gap-2">
          <DateRangePickerFilter table={table} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="ring-0 focus-visible:ring-0 text-muted-foreground"
              >
                {metodoPago ? (
                  <span className="flex gap-1 items-center">
                    {(() => {
                      return <>{metodoPago}</>;
                    })()}
                  </span>
                ) : (
                  "Método de pago"
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup
                value={metodoPago ?? undefined}
                onValueChange={handleMetodoChange}
                className="[&>div]:cursor-pointer"
              >
                {Object.entries(METODOS_PAGO).map(([key, value]) => {
                  return (
                    <DropdownMenuRadioItem
                      key={key}
                      value={key}
                      className="flex items-center gap-2"
                    >
                      {value}
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <MultipleSelector
          commandProps={{
            label: "Seleccione productos",
            className: "w-72 bg-white cursor-pointer text-muted-foreground",
          }}
          value={
            selectedProductos?.map((producto) => {
              const prod = (
                (table.options.meta as VentaAreaVentaTableMeta)?.productos ?? []
              ).find((p) => p.id === producto);
              return {
                label: prod?.descripcion ?? "",
                value: prod?.descripcion ?? "",
              };
            }) ?? []
          }
          defaultOptions={(
            (table.options.meta as VentaAreaVentaTableMeta)?.productos ?? []
          ).map((producto) => ({
            label: producto.descripcion,
            value: producto.descripcion,
          }))}
          onChange={onChangeProductos}
          placeholder="Seleccione productos"
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

      {children}
    </div>
  );
}
