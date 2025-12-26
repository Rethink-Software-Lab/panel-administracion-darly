"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { ArrowRightLeft, CornerUpRight, PlusCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { FormTransacciones } from "./FormTransacciones";
import { useState } from "react";
import { FormTransferencia } from "./FormTransferencia";
import { Cuenta } from "@/app/(with-layout)/finanzas/cuentas/types";
export function DropdownActionCuentas({
  cuentas,
  isError,
}: {
  cuentas: Cuenta[];
  isError: boolean;
}) {
  const [openTransacciones, setOpenTransacciones] = useState(false);
  const [openTransferencia, setOpenTransferencia] = useState(false);
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button disabled={isError} className="gap-1 items-center">
            <PlusCircle size={18} />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Agregar
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="[&>div]:cursor-pointer">
          <DropdownMenuItem onClick={() => setOpenTransacciones(true)}>
            <CornerUpRight className="mr-2 size-4 text-emerald-400" />
            Transacción
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenTransferencia(true)}>
            <ArrowRightLeft className="mr-2 size-4 text-amber-400" />
            Transferencia
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={openTransacciones} onOpenChange={setOpenTransacciones}>
        <SheetContent className="w-full sm:max-w-[600px] overflow-y-scroll">
          <SheetHeader>
            <SheetTitle>Agregar transacción</SheetTitle>
            <SheetDescription className="pb-4">
              Rellene el formulario para agregar una transacción.
            </SheetDescription>
          </SheetHeader>
          <FormTransacciones
            tarjetas={cuentas}
            setOpen={setOpenTransacciones}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={openTransferencia} onOpenChange={setOpenTransferencia}>
        <SheetContent className="w-full sm:max-w-[600px] overflow-y-scroll">
          <SheetHeader>
            <SheetTitle>Agregar transferencia</SheetTitle>
            <SheetDescription className="pb-4">
              Rellene el formulario para agregar una transferencia.
            </SheetDescription>
          </SheetHeader>
          <FormTransferencia cuentas={cuentas} setOpen={setOpenTransferencia} />
        </SheetContent>
      </Sheet>
    </>
  );
}
