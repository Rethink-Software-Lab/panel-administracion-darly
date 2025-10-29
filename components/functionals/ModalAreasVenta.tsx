"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogClose,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { InferInput } from "valibot";

import {
  addArea,
  updateArea,
} from "@/app/(with-layout)/areas-de-venta/actions";
import { toast } from "sonner";
import { CheckIcon, ChevronDown, LoaderCircle } from "lucide-react";
import { ReactNode, useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { AreaVenta } from "@/app/(with-layout)/areas-de-venta/types";
import { AreaVentaSchema } from "@/app/(with-layout)/areas-de-venta/schema";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";

export interface CuentaEfectivoForCommandCreateArea {
  id: number;
  nombre: string;
}

export default function ModalAreasVenta({
  data,
  cuentasEfectivo: cuentas,
  trigger,
}: {
  data?: AreaVenta;
  cuentasEfectivo: CuentaEfectivoForCommandCreateArea[];
  trigger: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openPopover, setOpenPopover] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<InferInput<typeof AreaVentaSchema>>({
    resolver: valibotResolver(AreaVentaSchema),
    defaultValues: {
      nombre: data?.nombre || "",
      color: data?.color || "",
      cuenta: data?.cuenta?.id.toString() || "",
    },
  });

  const onSubmit = async (dataForm: InferInput<typeof AreaVentaSchema>) => {
    setIsLoading(true);
    const { data: dataRes, error } = !data
      ? await addArea(dataForm)
      : await updateArea(data?.id, dataForm);
    setIsLoading(false);

    if (!error) {
      form.reset();
      setIsOpen(false);
      toast.success(dataRes);
    } else {
      toast.error(error);
    }
  };

  const getNombreCuenta = (id: string) => {
    const cuenta = cuentas?.find((cuenta) => cuenta?.id.toString() === id);
    return cuenta?.nombre || "Selecciona una cuenta";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data ? "Editar" : "Agregar"} Área de Venta</DialogTitle>
        </DialogHeader>
        <DialogDescription>Todos los campos son requeridos</DialogDescription>

        <Form {...form}>
          <form
            ref={formRef}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <Label>Nombre</Label>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <Label>Color</Label>
                  <FormControl>
                    <Input type="color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cuenta"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Label>Cuenta</Label>
                  <Popover open={openPopover} onOpenChange={setOpenPopover}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between contain-strict",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={!cuentas || cuentas.length < 1}
                        >
                          <div className="flex">
                            {field.value && (
                              <div className="hidden md:block w-6 aspect-square rounded-full bg-gradient-to-br mr-2 shrink-0 from-blue-500 to-blue-700" />
                            )}

                            {getNombreCuenta(field.value)}
                          </div>

                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      containerRef={formRef}
                      className="w-[320px] p-0"
                    >
                      <Command className="rounded-lg border shadow-md">
                        <CommandInput placeholder="Seleccione una cuenta" />
                        <CommandList>
                          <CommandEmpty>
                            Ningún resultado encontrado.
                          </CommandEmpty>
                          <CommandGroup heading="Sugerencias">
                            {cuentas?.map((cuenta) => (
                              <CommandItem
                                key={cuenta.id}
                                value={cuenta.id.toString()}
                                keywords={[cuenta.nombre]}
                                onSelect={(currentValue) => {
                                  field.onChange(
                                    currentValue === field.value
                                      ? ""
                                      : currentValue
                                  );
                                  setOpenPopover(false);
                                }}
                              >
                                <div className="flex gap-2 items-center ">
                                  <div className="w-6 aspect-square rounded-full bg-gradient-to-br from-blue-500 to-blue-700"></div>
                                  <p>{cuenta.nombre}</p>
                                </div>
                                <CheckIcon
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    cuenta.id.toString() === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4">
              <DialogFooter className="w-full flex gap-2 mt-2">
                <DialogClose asChild>
                  <Button type="button" className="w-full" variant="secondary">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      {data ? "Editando..." : "Agregando..."}
                    </>
                  ) : (
                    <>{data ? "Editar" : "Agregar"}</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
