"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { METODOS_PAGO } from "@/app/(with-layout)/(almacen-cafeteria)/entradas-cafeteria/types";
import { VentasCafeteria } from "@/app/(with-layout)/cafeteria/types";

export default function SheetInfoVentasCafeteria({
  data,
}: {
  data: VentasCafeteria;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen} modal={true}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Eye size={18} />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-scroll">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Información de venta
          </SheetTitle>
          <SheetDescription className="flex justify-between items-center gap-2">
            <span className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                Método de pago: {data.metodoPago}
              </span>
              {data.metodoPago !== METODOS_PAGO.EFECTIVO && (
                <span className="text-sm text-muted-foreground">
                  Cuenta:{" "}
                  {data.cuentas.map((cuenta) => cuenta.nombre).join(", ")}
                </span>
              )}
            </span>
            {data.metodoPago === METODOS_PAGO.MIXTO && (
              <span className="flex flex-col">
                <span>
                  Efectivo:{" "}
                  {Intl.NumberFormat("es-ES", {
                    style: "currency",
                    currency: "CUP",
                    currencyDisplay: "code",
                    maximumFractionDigits: 10,
                  }).format(parseFloat(data.efectivo))}
                </span>
                <span>
                  Transferencia:{" "}
                  {Intl.NumberFormat("es-ES", {
                    style: "currency",
                    currency: "CUP",
                    currencyDisplay: "code",
                    maximumFractionDigits: 10,
                  }).format(parseFloat(data.transferencia))}
                </span>
              </span>
            )}
          </SheetDescription>
        </SheetHeader>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.elaboraciones?.map((elaboracion) => (
              <TableRow key={elaboracion.id}>
                <TableCell className="font-semibold align-top w-1/2">
                  {elaboracion.nombre}
                </TableCell>
                <TableCell className="text-right">
                  {elaboracion.cantidad}
                </TableCell>
              </TableRow>
            ))}
            {data?.productos?.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell className="font-semibold align-top w-1/2">
                  {producto.nombre}
                </TableCell>
                <TableCell className="text-right">
                  {producto.cantidad}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SheetContent>
    </Sheet>
  );
}
