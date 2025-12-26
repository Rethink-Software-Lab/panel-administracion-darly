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
import {
  CheckIcon,
  ChevronDown,
  CirclePlus,
  CircleX,
  MinusCircle,
  Pencil,
  PlusCircle,
  X,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { InferOutput } from "valibot";
import { toast } from "sonner";
import { Fragment, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { METODOS_PAGO } from "@/app/(with-layout)/(almacen-cafeteria)/entradas-cafeteria/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CAJA_CAFETERIA, cn } from "@/lib/utils";
import { Banco, TipoCuenta } from "@/app/(with-layout)/finanzas/types";
import SelectProductoVentaCafeteria from "../SelectProductoVentasCafeteria";
import {
  addVentaCafeteria,
  editVentaCafeteria,
} from "@/app/(with-layout)/cafeteria/ventas/actions";
import {
  Productos_Elaboraciones,
  TarjetasVentas,
  VentasCafeteria,
} from "@/app/(with-layout)/cafeteria/types";
import { VentasCafeteriaSchema } from "@/app/(with-layout)/cafeteria/ventas/schema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export default function SheetVentasCafeteria({
  productos,
  cuentasBancarias,
  data,
}: {
  productos?: Productos_Elaboraciones[];
  cuentasBancarias?: TarjetasVentas[];
  data?: VentasCafeteria;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});

  const formRef = useRef<HTMLFormElement>(null);

  const productosDefault = (data?.productos || []).map((p) => {
    return {
      producto: p.id.toString(),
      cantidad: p.cantidad.toString(),
      isElaboracion: false,
    };
  });

  const elaboraciones = (data?.elaboraciones || []).map((p) => {
    return {
      producto: p.id.toString(),
      cantidad: p.cantidad.toString(),
      isElaboracion: true,
    };
  });

  const productosElaboraciones = [...productosDefault, ...elaboraciones];

  const parsedCuentas = data?.cuentas?.map((c) => {
    return {
      cuenta: c.id.toString(),
      tipo: c.tipo,
      cantidad: parseFloat(c.cantidad),
    };
  });

  const form = useForm<InferOutput<typeof VentasCafeteriaSchema>>({
    resolver: valibotResolver(VentasCafeteriaSchema),
    defaultValues: {
      metodoPago: data?.metodoPago || undefined,
      cuentas: parsedCuentas || undefined,
      productos:
        productosElaboraciones.length > 0
          ? productosElaboraciones
          : [{ producto: "", cantidad: "0", isElaboracion: false }],
    },
  });

  const {
    fields: fieldsCuentas,
    append: appendCuenta,
    remove: removeCuenta,
  } = useFieldArray({
    control: form.control,
    name: "cuentas",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "productos",
  });

  const metodoWatch = useWatch({
    control: form.control,
    name: "metodoPago",
  });

  const onSubmit = async (
    dataForm: InferOutput<typeof VentasCafeteriaSchema>
  ): Promise<void> => {
    const { data: dataRes, error } = await (data
      ? editVentaCafeteria(dataForm, data.id)
      : addVentaCafeteria(dataForm));
    if (error) {
      setError(error);
    } else {
      form.reset();
      toast.success(dataRes);
      setOpen(false);
      setError("");
    }
  };

  const handlePopoverOpenChange = (index: number, open: boolean) => {
    setOpenPopovers((prev) => ({ ...prev, [index]: open }));
  };

  const getColors = (selectedValue: string): string | undefined => {
    const { banco } =
      cuentasBancarias?.find(
        (cuenta) => cuenta?.id.toString() === selectedValue
      ) || {};

    if (selectedValue === CAJA_CAFETERIA) {
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
    if (id === CAJA_CAFETERIA) {
      return "Caja Cafeteria";
    } else {
      const cuenta = cuentasBancarias?.find(
        (cuenta) => cuenta?.id.toString() === id
      );
      return cuenta?.nombre || "Selecciona una cuenta";
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={true}>
      <SheetTrigger asChild>
        {data ? (
          <Button variant="outline" size="icon" className="gap-1 items-center">
            <Pencil size={18} />
            <span className="sr-only sm:whitespace-nowrap">Editar venta</span>
          </Button>
        ) : (
          <Button className="gap-1 items-center">
            <PlusCircle size={18} />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Agregar venta
            </span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-scroll">
        <SheetHeader>
          <SheetTitle>{data ? "Editar" : "Agregar"} venta</SheetTitle>
          <SheetDescription className="pb-4">
            Rellene el formulario para {data ? "editar" : "agregar"} una venta.
          </SheetDescription>
          {error && (
            <Alert className="text-left" variant="destructive">
              <CircleX className="h-5 w-5" />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {form.formState.errors.productos?.root && (
            <Alert className="text-left" variant="destructive">
              <CircleX className="h-5 w-5" />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>
                {form.formState.errors.productos.root?.message}
              </AlertDescription>
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
                name="metodoPago"
                render={({ field }) => (
                  <FormItem>
                    <Label>Método de pago</Label>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        switch (value) {
                          case METODOS_PAGO.EFECTIVO:
                            form.setValue("cuentas", [
                              {
                                cuenta: CAJA_CAFETERIA,
                                cantidad: undefined,
                                tipo: TipoCuenta.EFECTIVO,
                              },
                            ]);
                            break;
                          case METODOS_PAGO.TRANSFERENCIA:
                            form.setValue("cuentas", [
                              {
                                cuenta: "",
                                cantidad: undefined,
                                tipo: TipoCuenta.BANCARIA,
                              },
                            ]);
                            break;
                          case METODOS_PAGO.MIXTO:
                            form.setValue("cuentas", [
                              {
                                cuenta: CAJA_CAFETERIA,
                                cantidad: 0,
                                tipo: TipoCuenta.EFECTIVO,
                              },
                              {
                                cuenta: "",
                                cantidad: 0,
                                tipo: TipoCuenta.BANCARIA,
                              },
                            ]);
                            break;
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn(
                            form.formState.errors?.metodoPago &&
                              "border-destructive"
                          )}
                        >
                          <SelectValue placeholder="Selecciona un método de pago" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                        <SelectItem value="TRANSFERENCIA">
                          Transferencia
                        </SelectItem>
                        <SelectItem value="MIXTO">Mixto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {metodoWatch && metodoWatch !== METODOS_PAGO.EFECTIVO && (
                <>
                  <div
                    className={cn(
                      "grid [&>span]:pl-2 mb-2 [&>span]:text-muted-foreground border-b border-muted",
                      form.getValues("cuentas")?.length > 1 && "grid-cols-2"
                    )}
                  >
                    <span>Cuenta</span>
                    {form.getValues("cuentas")?.length > 1 && (
                      <span>Cantidad</span>
                    )}
                  </div>
                  <div className="grid gap-2 grid-cols-2">
                    {fieldsCuentas.map((cuenta, index, row) => (
                      <Fragment key={cuenta.id}>
                        <FormField
                          control={form.control}
                          name={`cuentas.${index}.cuenta`}
                          render={({ field }) => (
                            <FormItem
                              className={cn(
                                "flex flex-col",
                                row.length < 2 && "col-span-2"
                              )}
                            >
                              <Popover
                                open={openPopovers[index] ?? false}
                                onOpenChange={(open) =>
                                  handlePopoverOpenChange(index, open)
                                }
                              >
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        "justify-between contain-strict",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      disabled={field.value === CAJA_CAFETERIA}
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
                                    <CommandInput placeholder="Escribe un código..." />
                                    <CommandList>
                                      <CommandEmpty>
                                        Ningún resultado encontrado.
                                      </CommandEmpty>
                                      <CommandGroup heading="Sugerencias">
                                        {cuentasBancarias
                                          ?.filter((c) => {
                                            const cuentasSeleccionadas = form
                                              .getValues("cuentas")
                                              .map(
                                                (cuentaObj, i) =>
                                                  i !== index &&
                                                  cuentaObj.cuenta
                                              )
                                              .filter(Boolean);

                                            const yaSeleccionada =
                                              cuentasSeleccionadas.includes(
                                                c.id.toString()
                                              );
                                            if (yaSeleccionada) return false;

                                            if (
                                              !metodoWatch ||
                                              metodoWatch === METODOS_PAGO.MIXTO
                                            ) {
                                              return true;
                                            }

                                            return !!c.banco;
                                          })
                                          .map((cuenta) => (
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
                                                form.setValue(
                                                  `cuentas.${index}.tipo`,
                                                  TipoCuenta.BANCARIA
                                                );
                                                handlePopoverOpenChange(
                                                  index,
                                                  false
                                                );
                                              }}
                                            >
                                              <div className="flex gap-2 items-center ">
                                                <div
                                                  className={cn(
                                                    "w-6 aspect-square rounded-full bg-gradient-to-br",
                                                    getColors(
                                                      cuenta.id.toString()
                                                    )
                                                  )}
                                                ></div>
                                                <p>{cuenta.nombre}</p>
                                              </div>
                                              <CheckIcon
                                                className={cn(
                                                  "ml-auto h-4 w-4",
                                                  cuenta.id.toString() ===
                                                    field.value
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

                        {row.length > 1 && (
                          <div className="flex md:gap-1">
                            <div className="w-full">
                              <FormField
                                control={form.control}
                                name={`cuentas.${index}.cantidad`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        step={0.01}
                                        onChange={(e) => {
                                          const value = parseFloat(
                                            e.target.value
                                          );
                                          field.onChange(
                                            isNaN(value) ? 0 : value
                                          );
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {index > 0 && (
                              <Button
                                onClick={() => {
                                  (form.getValues("cuentas").length === 2 &&
                                    form.setValue("cuentas", [
                                      {
                                        cuenta:
                                          form.getValues("cuentas")?.[0]
                                            ?.cuenta,
                                        cantidad: undefined,
                                        tipo: form.getValues("cuentas")?.[0]
                                          ?.tipo,
                                      },
                                    ]),
                                    removeCuenta(index));
                                }}
                                size="icon"
                                variant="ghost"
                                className="gap-1"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </Fragment>
                    ))}
                  </div>

                  <div className="col-span-2 text-center">
                    <Button
                      onClick={() => {
                        (form.getValues("cuentas").length === 1 &&
                          form.setValue("cuentas", [
                            {
                              cuenta: form.getValues("cuentas")?.[0]?.cuenta,
                              cantidad: 0,
                              tipo: form.getValues("cuentas")?.[0]?.tipo,
                            },
                          ]),
                          appendCuenta({
                            cuenta: "",
                            cantidad: 0,
                            tipo: "",
                          }));
                      }}
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">Añadir </span>
                      <span>cuenta</span>
                    </Button>
                  </div>
                </>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((producto, index) => (
                    <TableRow key={`${producto.id}-${index}`}>
                      <TableCell className="font-semibold align-top w-1/2">
                        <SelectProductoVentaCafeteria
                          form={form}
                          index={index}
                          productos={productos || []}
                          formRef={formRef}
                        />
                      </TableCell>

                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`productos.${index}.cantidad`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0.01}
                                  step="0.01"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>

                      <TableCell className="align-top text-center">
                        {index > 0 && (
                          <Button
                            onClick={() => remove(index)}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <MinusCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  <Button
                    className="gap-1"
                    onClick={() =>
                      append({
                        producto: "",
                        cantidad: "0",
                        isElaboracion: false,
                      })
                    }
                    variant="outline"
                    size="sm"
                  >
                    <CirclePlus size={14} />
                    Agregar
                  </Button>
                </TableCaption>
              </Table>
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
