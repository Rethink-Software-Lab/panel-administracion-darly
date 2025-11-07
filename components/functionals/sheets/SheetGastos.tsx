"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronDown, CircleX, Pen, PlusCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, useWatch } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";

import { Input } from "@/components/ui/input";
import { InferInput } from "valibot";
import { toast } from "sonner";
import { useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AreaVentaForSelectGasto,
  CuentaForSelectGasto,
  FrecuenciasGastos,
  Gasto,
  TiposGastos,
} from "@/app/(with-layout)/gastos/types";
import { addGasto, editGasto } from "@/app/(with-layout)/gastos/actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Banco, TipoCuenta } from "@/app/(with-layout)/cuentas/types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { GastosSchema } from "@/app/(with-layout)/gastos/schema";
import MultipleSelector from "@/components/ui/multiselect";

export default function SheetGastos({
  data,
  areas,
  cuentas,
}: {
  data?: Gasto;
  areas: AreaVentaForSelectGasto[];
  cuentas: CuentaForSelectGasto[];
}) {
  const [open, setOpen] = useState(false);
  const [openPopover, setOpenPopover] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const areasDefaultValues = data?.areas_venta.map((a) => {
    return { label: a.nombre, value: a.id.toString() };
  });

  const form = useForm<InferInput<typeof GastosSchema>>({
    resolver: valibotResolver(GastosSchema),
    defaultValues: {
      descripcion: data?.descripcion || "",
      cuenta: data?.cuenta?.id.toLocaleString() || "",
      tipo: data?.tipo,
      frecuencia: data?.frecuencia || undefined,
      cantidad: data?.cantidad || 0,
      diaMes: data?.diaMes || undefined,
      diaSemana: data?.diaSemana?.toLocaleString() || undefined,
      areas_venta: data?.is_cafeteria
        ? areasDefaultValues?.concat([
            { label: "Cafetería", value: "cafeteria" },
          ])
        : areasDefaultValues || [],
    },
  });

  const tipo = useWatch({ control: form.control, name: "tipo" });
  const frecuencia = useWatch({ control: form.control, name: "frecuencia" });

  const onSubmit = async (
    dataForm: InferInput<typeof GastosSchema>
  ): Promise<void> => {
    const { data: dataRes, error } = await (data
      ? editGasto(data.id, dataForm)
      : addGasto(dataForm));

    if (error) {
      setError(error);
    } else {
      form.reset();
      setError("");
      toast.success(dataRes);
      setOpen(false);
    }
  };

  const getColors = (selectedValue: string): string | undefined => {
    const { tipo, banco } =
      cuentas.find((cuenta) => cuenta?.id.toString() === selectedValue) || {};

    if (tipo === TipoCuenta.EFECTIVO) {
      return "from-blue-500 to-blue-700";
    } else {
      switch (banco) {
        case Banco.BANDEC:
          return "from-[#6c0207] to-[#bc1f26]";
        case Banco.BPA:
          return "from-[#1d6156] to-[#1d6156]";
      }
    }
  };

  const getNombreCuenta = (id: string) => {
    const cuenta = cuentas?.find((cuenta) => cuenta?.id.toString() === id);
    return cuenta?.nombre || "Selecciona una cuenta";
  };

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={true}>
      <SheetTrigger asChild>
        {data ? (
          <Button variant="outline" size="icon">
            <span className="sr-only">Editar</span>
            <Pen size={18} />
          </Button>
        ) : (
          <Button className="gap-1 items-center">
            <PlusCircle size={18} />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Agregar
            </span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-scroll">
        <SheetHeader>
          <SheetTitle>{data ? "Editar" : "Agregar"} gasto</SheetTitle>
          <SheetDescription className="pb-4">
            Especifique el tipo de gasto y la cantidad que desea registrar.
          </SheetDescription>
          {error && (
            <Alert className="text-left" variant="destructive">
              <CircleX className="h-5 w-5" />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem className="w-full text-left">
                    <Label>Descripción</Label>
                    <FormControl>
                      <Input {...field} />
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
                                <div
                                  className={cn(
                                    "hidden md:block w-6 aspect-square rounded-full bg-gradient-to-br mr-2 shrink-0",
                                    getColors(field.value)
                                  )}
                                />
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
                                    <div
                                      className={cn(
                                        "w-6 aspect-square rounded-full bg-gradient-to-br",
                                        getColors(cuenta.id.toString())
                                      )}
                                    ></div>
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

              <FormField
                control={form.control}
                name="areas_venta"
                render={({ field }) => (
                  <FormItem>
                    <Label>
                      Mostar en reporte de las siguientes áreas de venta
                    </Label>
                    <FormControl>
                      <MultipleSelector
                        {...field}
                        defaultOptions={
                          [
                            { nombre: "Cafeteria", id: "cafeteria" },
                            ...areas,
                          ].map((area) => ({
                            label: area?.nombre,
                            value: area.id.toString(),
                          })) ?? []
                        }
                        placeholder="Seleccione áreas de venta..."
                        emptyIndicator={
                          <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                            no results found.
                          </p>
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem className="w-full text-left">
                    <Label>Tipo de gasto</Label>
                    <Select
                      onValueChange={(value) => {
                        if (value === TiposGastos.VARIABLE) {
                          form.setValue("frecuencia", undefined);
                          form.setValue("diaSemana", undefined);
                          form.setValue("diaMes", undefined);
                        }
                        field.onChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un tipo de gasto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TiposGastos.FIJO}>Fijo</SelectItem>
                        <SelectItem value={TiposGastos.VARIABLE}>
                          Variable
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tipo === TiposGastos.FIJO && (
                <FormField
                  control={form.control}
                  name="frecuencia"
                  render={({ field }) => (
                    <FormItem className="w-full text-left">
                      <Label>Frecuencia</Label>
                      <Select
                        onValueChange={(value) => {
                          if (value === FrecuenciasGastos.MENSUAL) {
                            form.setValue("diaSemana", undefined);
                          }
                          if (value === FrecuenciasGastos.SEMANAL) {
                            form.setValue("diaMes", undefined);
                          }
                          if (
                            value === FrecuenciasGastos.LUNES_SABADO ||
                            value === FrecuenciasGastos.DIARIO
                          ) {
                            form.setValue("diaSemana", undefined);
                            form.setValue("diaMes", undefined);
                          }
                          field.onChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una frecuencia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={FrecuenciasGastos.DIARIO}>
                            Diario
                          </SelectItem>
                          <SelectItem value={FrecuenciasGastos.SEMANAL}>
                            Semanal
                          </SelectItem>
                          <SelectItem value={FrecuenciasGastos.MENSUAL}>
                            Mensual
                          </SelectItem>
                          <SelectItem value={FrecuenciasGastos.LUNES_SABADO}>
                            Lunes - Sábado
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {frecuencia === FrecuenciasGastos.SEMANAL && (
                <FormField
                  control={form.control}
                  name="diaSemana"
                  render={({ field }) => (
                    <FormItem className="w-full text-left">
                      <Label>Día de la semana</Label>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un día" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Lunes</SelectItem>
                          <SelectItem value="1">Martes</SelectItem>
                          <SelectItem value="2">Miércoles</SelectItem>
                          <SelectItem value="3">Jueves</SelectItem>
                          <SelectItem value="4">Viernes</SelectItem>
                          <SelectItem value="5">Sábado</SelectItem>
                          <SelectItem value="6">Domingo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {frecuencia === FrecuenciasGastos.MENSUAL && (
                <FormField
                  control={form.control}
                  name="diaMes"
                  render={({ field }) => (
                    <FormItem className="w-full text-left">
                      <Label>Día del mes</Label>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          type="number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="cantidad"
                render={({ field }) => (
                  <FormItem className="w-full text-left">
                    <Label>Cantidad</Label>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                        type="number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit">{data ? "Editar" : "Agregar"}</Button>
              </div>
            </form>
          </Form>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
