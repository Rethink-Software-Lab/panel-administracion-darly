"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckIcon, X, PlusCircle, ChevronDown } from "lucide-react";

import { CAJA_MESAS, CAJA_SALON, cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { VentasSchema } from "@/app/(with-layout)/areas-de-venta/[id]/schema";
import { InferOutput } from "valibot";

import { toast } from "sonner";
import { CircleX, LoaderCircle } from "lucide-react";
import { Fragment, ReactNode, useRef, useState } from "react";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { METODOS_PAGO } from "@/app/(with-layout)/(almacen-cafeteria)/entradas-cafeteria/types";
import { Banco, TipoCuenta } from "@/app/(with-layout)/tarjetas/types";
import {
  AllProductos,
  AreaVentaInResponseOneAreaVenta,
  CuentasBancarias,
} from "@/app/(with-layout)/areas-de-venta/[id]/types";
import { addVenta } from "@/app/(with-layout)/areas-de-venta/[id]/actions";
import { Tag, TagInput } from "emblor";

export default function ModalVentas({
  trigger,
  areaVenta,
  productosInfo,
  cuentasBancarias,
}: {
  areaVenta: AreaVentaInResponseOneAreaVenta;
  productosInfo: AllProductos[];
  cuentasBancarias: CuentasBancarias[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});

  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);

  const form = useForm<InferOutput<typeof VentasSchema>>({
    resolver: valibotResolver(VentasSchema),
  });

  const {
    fields: fieldsCuentas,
    append: appendCuenta,
    remove: removeCuenta,
  } = useFieldArray({
    control: form.control,
    name: "cuentas",
  });

  const info_producto = useWatch({
    control: form.control,
    name: "producto_info",
  });

  const metodoWatch = useWatch({
    control: form.control,
    name: "metodoPago",
  });

  const onSubmit = async (
    dataForm: InferOutput<typeof VentasSchema>
  ): Promise<void> => {
    setIsLoading(true);
    const { data: dataRes, error } = await addVenta({
      ...dataForm,
      zapatos_id: dataForm.zapatos_id?.map((item) => item.text),
      areaVenta,
    });
    setIsLoading(false);
    if (!error) {
      form.reset();
      setIsOpen(false);
      toast.success(dataRes);
    }
    setError(error);
  };

  const handlePopoverOpenChange = (index: number, open: boolean) => {
    setOpenPopovers((prev) => ({ ...prev, [index]: open }));
  };

  const getColors = (selectedValue: string): string | undefined => {
    const { banco } =
      cuentasBancarias?.find(
        (cuenta) => cuenta?.id.toString() === selectedValue
      ) || {};

    if (selectedValue === CAJA_SALON || selectedValue === CAJA_MESAS) {
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
    if (id === CAJA_SALON) {
      return "Caja Salón";
    } else if (id === CAJA_MESAS) {
      return "Caja Mesas";
    } else {
      const cuenta = cuentasBancarias?.find(
        (cuenta) => cuenta?.id.toString() === id
      );
      return cuenta?.nombre || "Selecciona una cuenta";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-[500px] overflow-y-scroll space-y-4">
        <SheetHeader className="space-y-0">
          <SheetTitle>Agregar Venta</SheetTitle>
          <SheetDescription>Todos los campos son requeridos</SheetDescription>
        </SheetHeader>
        {error && (
          <Alert variant="destructive">
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
                              cuenta: areaVenta.isMesa
                                ? CAJA_MESAS
                                : CAJA_SALON,
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
                              cuenta: areaVenta.isMesa
                                ? CAJA_MESAS
                                : CAJA_SALON,
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
                    form.getValues("cuentas").length > 1 && "grid-cols-2"
                  )}
                >
                  <span>Cuenta</span>
                  {form.getValues("cuentas").length > 1 && (
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
                                    disabled={
                                      field.value === CAJA_SALON ||
                                      field.value === CAJA_MESAS
                                    }
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
                                                i !== index && cuentaObj.cuenta
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
                                form.getValues("cuentas").length === 2 &&
                                  form.setValue("cuentas", [
                                    {
                                      cuenta:
                                        form.getValues("cuentas")?.[0]?.cuenta,
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

            <FormField
              control={form.control}
              name="producto_info"
              render={({ field }) => (
                <FormItem className="flex flex-col mt-2">
                  <Label>Producto</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? productosInfo?.find(
                                (producto) => producto?.id === field.value.id
                              )?.descripcion
                            : "Selecciona un producto"}
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
                            {productosInfo?.map((producto) => (
                              <CommandItem
                                key={producto.id}
                                value={producto.id?.toString()}
                                keywords={[producto.descripcion]}
                                onSelect={(currentValue) => {
                                  const esZapato = productosInfo?.find(
                                    (e) => e.id === Number(currentValue)
                                  )?.isZapato;

                                  if (esZapato) {
                                    form.setValue("cantidad", undefined);
                                    form.setValue("zapatos_id", []);
                                  } else {
                                    form.setValue("zapatos_id", undefined);
                                    form.setValue("cantidad", 0);
                                  }
                                  field.onChange(
                                    Number(currentValue) === field.value?.id
                                      ? ""
                                      : {
                                          id: Number(currentValue),
                                          isZapato: esZapato,
                                        }
                                  );
                                  setOpen(false);
                                }}
                              >
                                {producto.descripcion}
                                <CheckIcon
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    producto.id === field.value?.id
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
            {info_producto && info_producto.isZapato && (
              <FormField
                control={form.control}
                name="zapatos_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start">
                    <Label className="text-left">Ids</Label>
                    <FormControl>
                      <TagInput
                        {...field}
                        value={field.value?.map((item) => ({
                          id: item.id,
                          text: item.text.toString(),
                        }))}
                        placeholder="Ids de zapatos"
                        tags={tags}
                        styleClasses={{
                          inlineTagsContainer:
                            "border-input rounded-md bg-background shadow-xs transition-[color,box-shadow] outline-none p-1 gap-1",
                          input: "w-full min-w-[80px] shadow-none px-2 h-7",
                          tag: {
                            body: "h-7 relative bg-background border border-input hover:bg-background rounded-md font-medium text-xs ps-2 pe-7",
                            closeButton:
                              "absolute -inset-y-px -end-px p-0 rounded-e-md flex size-7 transition-[color,box-shadow] outline-none text-muted-foreground/80 hover:text-foreground",
                          },
                        }}
                        setTags={(newTags) => {
                          setTags(newTags);
                          const tagsArray = Array.isArray(newTags)
                            ? newTags
                            : newTags([]);
                          form.setValue(
                            "zapatos_id",
                            tagsArray.map((tag) => ({
                              id: tag.id,
                              text: Number(tag.text),
                            }))
                          );
                        }}
                        validateTag={(tag) => !!Number(tag)}
                        activeTagIndex={activeTagIndex}
                        setActiveTagIndex={setActiveTagIndex}
                      />
                    </FormControl>
                    <FormDescription>
                      Agregue los ids separandolos por coma o enter
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {info_producto && !info_producto.isZapato && (
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  {...form.register("cantidad", { valueAsNumber: true })}
                  type="number"
                />
                <p className="text-[0.8rem] font-medium text-destructive">
                  {form.formState.errors?.cantidad?.message}
                </p>
              </div>
            )}

            <div className="grid gap-4">
              <SheetFooter className="w-full flex gap-2 mt-2">
                <SheetClose asChild>
                  <Button type="button" className="w-full" variant="secondary">
                    Cancelar
                  </Button>
                </SheetClose>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    "Agregar"
                  )}
                </Button>
              </SheetFooter>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
