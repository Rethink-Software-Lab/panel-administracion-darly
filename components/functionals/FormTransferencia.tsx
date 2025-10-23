"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckIcon,
  ChevronDown,
  CircleX,
  Loader2,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useForm, useWatch } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { createTransferenciaSchema } from "@/app/(with-layout)/cuentas/schema";

import { Input } from "@/components/ui/input";
import { InferInput, InferOutput } from "valibot";
import { toast } from "sonner";
import { useMemo, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Banco, Tarjetas, TipoCuenta } from "@/app/(with-layout)/cuentas/types";
import { addTransferencia } from "@/app/(with-layout)/cuentas/actions";
import { cn } from "@/lib/utils";
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

export function FormTransferencia({
  cuentas,
  setOpen,
}: {
  cuentas: Tarjetas[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openPopoverOrigen, setOpenPopoverOrigen] = useState(false);
  const [openPopoverDestino, setOpenPopoverDestino] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const TransferenciaSchema = useMemo(
    () => createTransferenciaSchema(cuentas),
    [cuentas]
  );

  const form = useForm<InferInput<typeof TransferenciaSchema>>({
    resolver: valibotResolver(TransferenciaSchema),
    defaultValues: {
      cuentaOrigen: "",
      cuentaDestino: "",
      cantidad: "",
      tipoCambio: undefined,
    },
  });

  const cuentaOrigenWatch = useWatch({
    name: "cuentaOrigen",
    control: form.control,
  });

  const cuentaDestinoWatch = useWatch({
    name: "cuentaDestino",
    control: form.control,
  });

  const onSubmit = async (
    dataForm: InferOutput<typeof TransferenciaSchema>
  ): Promise<void> => {
    setLoading(true);
    setError("");
    const { data: dataRes, error } = await addTransferencia(dataForm);

    if (error) {
      setError(error);
      setLoading(false);
    } else {
      form.reset();
      setError("");
      setLoading(false);
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
    <div className="flex flex-col gap-4">
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
          onSubmit={form.handleSubmit(onSubmit as any)}
          className="space-y-4"
        >
          <div className="flex w-full items-end gap-2">
            <FormField
              control={form.control}
              name="cuentaOrigen"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full">
                  <Label>Cuenta origen</Label>
                  <Popover
                    open={openPopoverOrigen}
                    onOpenChange={setOpenPopoverOrigen}
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
                            {cuentas
                              ?.filter(
                                (c) =>
                                  c.id.toString() !==
                                  form.getValues("cuentaDestino")
                              )
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
                                    setOpenPopoverOrigen(false);
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
            <ArrowRight className="size-12" />
            <FormField
              control={form.control}
              name="cuentaDestino"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full">
                  <Label>Cuenta destino</Label>
                  <Popover
                    open={openPopoverDestino}
                    onOpenChange={setOpenPopoverDestino}
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
                            {cuentas
                              ?.filter(
                                (c) =>
                                  c.id !==
                                  Number(form.getValues("cuentaOrigen"))
                              )
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
                                    setOpenPopoverDestino(false);
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
          </div>
          <FormField
            control={form.control}
            name="cantidad"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <Label>Cantidad</Label>
                <FormControl>
                  <Input {...field} type="number" step={0.01} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {cuentaOrigenWatch &&
            cuentaDestinoWatch &&
            cuentas.find((c) => c.id.toString() === cuentaOrigenWatch)
              ?.moneda !==
              cuentas.find((c) => c.id.toString() === cuentaDestinoWatch)
                ?.moneda && (
              <FormField
                control={form.control}
                name="tipoCambio"
                render={({ field }) => (
                  <FormItem className="w-full text-left">
                    <Label>Tipo de cambio</Label>
                    <FormControl>
                      <Input {...field} type="number" step={0.01} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

          <div className="flex justify-end">
            <Button disabled={loading} type="submit" className="gap-2">
              {loading && <Loader2 className="animate-spin size-4" />}
              {loading ? "Agregando..." : "Agregar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
