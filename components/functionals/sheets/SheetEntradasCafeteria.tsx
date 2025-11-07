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
  ChevronDown,
  CirclePlus,
  CircleX,
  MinusCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";

import { Input } from "@/components/ui/input";
import { InferInput, InferOutput } from "valibot";
import { toast } from "sonner";
import { Fragment, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { addEntradaCafeteria } from "@/app/(with-layout)/(almacen-cafeteria)/entradas-cafeteria/actions";

import {
  METODOS_PAGO,
  ProductoEntrada,
} from "@/app/(with-layout)/(almacen-cafeteria)/entradas-cafeteria/types";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SelectProductoEntradaCafeteria from "../SelectProductoEntradaCafeteria";
import { Banco, Tarjetas, TipoCuenta } from "@/app/(with-layout)/cuentas/types";
import { cn } from "@/lib/utils";
import ComboboxProveedorCafeteria from "../combobox-proveedor-cafeteria";
import { Proveedor } from "@/app/(with-layout)/proveedores/types";
import { EntradaCafeteriaSchema } from "@/app/(with-layout)/(almacen-cafeteria)/entradas-cafeteria/schema";
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

export default function SheetEntradasCafeteria({
  productos,
  cuentas,
  proveedores,
}: {
  productos: ProductoEntrada[];
  cuentas: Omit<Tarjetas, "total_transferencias_mes" | "moneda">[];
  proveedores: Pick<Proveedor, "id" | "nombre">[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isManual, setIsManual] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});

  const form = useForm<InferInput<typeof EntradaCafeteriaSchema>>({
    resolver: valibotResolver(EntradaCafeteriaSchema),
    defaultValues: {
      proveedor: "",
      comprador: "",
      productos: [
        { producto: "", cantidad: "0", importe: "0", precio_venta: "0" },
      ],
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
    dataForm: InferOutput<typeof EntradaCafeteriaSchema>
  ): Promise<void> => {
    const { data: dataRes, error } = await addEntradaCafeteria(dataForm);

    if (error) {
      setError(error);
    } else {
      form.reset();
      setError("");
      toast.success(dataRes);
      setOpen(false);
    }
  };

  const handlePopoverOpenChange = (index: number, open: boolean) => {
    setOpenPopovers((prev) => ({ ...prev, [index]: open }));
  };

  const getColors = (selectedValue: string): string | undefined => {
    const { banco, tipo } =
      cuentas?.find((cuenta) => cuenta?.id.toString() === selectedValue) || {};

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
        <Button className="gap-1 items-center">
          <PlusCircle size={18} />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Agregar
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-scroll">
        <SheetHeader>
          <SheetTitle>Agregar entrada</SheetTitle>
          <SheetDescription className="pb-4">
            Ingrese los detalles de la entrada del producto al almacén de la
            cafetería, incluyendo la cantidad, el proveedor y el comprador.
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

          {form.formState.errors.cuentas?.root && (
            <Alert className="text-left" variant="destructive">
              <CircleX className="h-5 w-5" />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>
                {form.formState.errors.cuentas.root?.message}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit as any)}
              className="space-y-4"
            >
              <ComboboxProveedorCafeteria
                form={form}
                formRef={formRef}
                proveedores={proveedores}
                isManual={isManual}
                setIsManual={setIsManual}
              />
              {isManual && (
                <>
                  <FormField
                    control={form.control}
                    name="proveedor_nombre"
                    render={({ field }) => (
                      <FormItem className="w-full text-left">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Nombre del proveedor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proveedor_nit"
                    render={({ field }) => (
                      <FormItem className="w-full text-left">
                        <FormControl>
                          <Input {...field} placeholder="NIT del proveedor" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proveedor_telefono"
                    render={({ field }) => (
                      <FormItem className="w-full text-left">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Teléfono del proveedor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proveedor_direccion"
                    render={({ field }) => (
                      <FormItem className="w-full text-left">
                        <FormControl>
                          <Input {...field} placeholder="Domicilio soial" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proveedor_no_cuenta_cup"
                    render={({ field }) => (
                      <FormItem className="w-full text-left">
                        <FormControl>
                          <Input {...field} placeholder="Cuenta en CUP" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proveedor_no_cuenta_mayorista"
                    render={({ field }) => (
                      <FormItem className="w-full text-left">
                        <FormControl>
                          <Input {...field} placeholder="Cuenta Mayorista" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <FormField
                control={form.control}
                name="comprador"
                render={({ field }) => (
                  <FormItem className="w-full text-left">
                    <Label>Comprador</Label>
                    <FormControl>
                      <Input {...field} placeholder="Comprador..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                          case METODOS_PAGO.TRANSFERENCIA:
                            form.setValue("cuentas", [
                              {
                                cuenta: "",
                                cantidad: undefined,
                                tipo: TipoCuenta.BANCARIA,
                              },
                            ]);
                            break;

                          default:
                            form.setValue("cuentas", [
                              {
                                cuenta: "",
                                cantidad: undefined,
                                tipo: TipoCuenta.EFECTIVO,
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

              {metodoWatch && (
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
                                    <CommandInput placeholder="Buscar cuenta..." />
                                    <CommandList>
                                      <CommandEmpty>
                                        Ningún resultado encontrado.
                                      </CommandEmpty>
                                      <CommandGroup heading="Sugerencias">
                                        {cuentas
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

                                            if (
                                              metodoWatch ===
                                              METODOS_PAGO.EFECTIVO
                                            ) {
                                              return (
                                                c.tipo === TipoCuenta.EFECTIVO
                                              );
                                            }

                                            return !!c.banco;
                                          })
                                          .map((cuenta) => (
                                            <CommandItem
                                              key={cuenta.id}
                                              className={cn(
                                                "flex justify-between gap-1 cursor-pointer",
                                                cuenta.id.toString() ===
                                                  field.value &&
                                                  "border border-blue-500"
                                              )}
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
                                                  cuenta.tipo
                                                );
                                                handlePopoverOpenChange(
                                                  index,
                                                  false
                                                );
                                              }}
                                            >
                                              <div className="flex items-center gap-2">
                                                <div
                                                  className={cn(
                                                    "w-6 aspect-square rounded-full bg-gradient-to-br",
                                                    getColors(
                                                      cuenta.id.toString()
                                                    )
                                                  )}
                                                ></div>
                                                <p className="line-clamp-1">
                                                  {cuenta.nombre}
                                                </p>
                                              </div>
                                              <div className="ml-auto">
                                                <p className="text-xs text-muted-foreground">
                                                  {Intl.NumberFormat("es-CU", {
                                                    style: "currency",
                                                    currency: "CUP",
                                                  }).format(
                                                    Number(cuenta?.saldo)
                                                  )}
                                                </p>
                                              </div>
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
                                  form.getValues("cuentas").length === 2 &&
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
                                    removeCuenta(index);
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
                        form.getValues("cuentas").length === 1 &&
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
                          });
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
                    <TableRow key={producto.id}>
                      <TableCell className="align-top w-1/2 space-y-2">
                        <SelectProductoEntradaCafeteria
                          form={form}
                          index={index}
                          productos={productos || []}
                          formRef={formRef}
                        />
                        <FormField
                          control={form.control}
                          name={`productos.${index}.importe`}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">
                                Importe
                              </Label>
                              <FormControl>
                                <Input
                                  style={{ marginTop: 0 }}
                                  type="number"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>

                      <TableCell className="space-y-2">
                        <FormField
                          control={form.control}
                          name={`productos.${index}.cantidad`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`productos.${index}.precio_venta`}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <Label className="text-sm font-medium text-muted-foreground">
                                Precio Venta
                              </Label>
                              <FormControl>
                                <Input
                                  {...field}
                                  style={{ marginTop: 0 }}
                                  type="number"
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
                        importe: "0",
                        precio_venta: "0",
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
                <Button type="submit">Agregar</Button>
              </div>
            </form>
          </Form>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
