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
import { CircleX, PlusSquare } from "lucide-react";
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
import { CuentasSchema } from "@/app/(with-layout)/cuentas/schema";

import { Input } from "@/components/ui/input";
import { InferInput, InferOutput } from "valibot";
import { toast } from "sonner";
import { useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Banco, Moneda, TipoCuenta } from "@/app/(with-layout)/cuentas/types";
import { addCuenta } from "@/app/(with-layout)/cuentas/actions";

export default function SheetCuentas({ isError }: { isError: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<InferInput<typeof CuentasSchema>>({
    resolver: valibotResolver(CuentasSchema),
    defaultValues: {
      nombre: "",
      saldo_inicial: "0",
    },
  });

  const tipoWatch = useWatch({
    name: "tipo",
    control: form.control,
  });

  const onSubmit = async (
    dataForm: InferOutput<typeof CuentasSchema>
  ): Promise<void> => {
    const { data: dataRes, error } = await addCuenta(dataForm);

    if (error) {
      setError(error);
    } else {
      form.reset();
      setError("");
      toast.success(dataRes);
      setOpen(false);
    }
  };
  return (
    <Sheet open={open} onOpenChange={setOpen} modal={true}>
      <SheetTrigger disabled={isError}>
        <Card
          style={{ flex: "0 0 auto", scrollSnapAlign: "start" }}
          className="aspect-video h-full cursor-pointer"
        >
          <CardContent className="text-black/40 h-full p-8 flex flex-col gap-2 justify-center items-center">
            <PlusSquare size={24} />
            <p className="text-xl font-bold">Agregar Tarjeta</p>
          </CardContent>
        </Card>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-scroll">
        <SheetHeader>
          <SheetTitle>Agregar tarjeta</SheetTitle>
          <SheetDescription className="pb-4">
            Rellene el formulario para agregar una tarjeta.
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
              onSubmit={form.handleSubmit(onSubmit as any)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem className="w-full text-left">
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
                name="tipo"
                render={({ field }) => (
                  <FormItem className="w-full text-left">
                    <Label>Tipo de cuenta</Label>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === TipoCuenta.EFECTIVO) {
                          form.setValue("banco", undefined);
                          form.clearErrors("banco");
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un tipo de cuenta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TipoCuenta.EFECTIVO}>
                          Efectivo
                        </SelectItem>
                        <SelectItem value={TipoCuenta.BANCARIA}>
                          Bancaria
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tipoWatch === TipoCuenta.BANCARIA && (
                <FormField
                  control={form.control}
                  name="banco"
                  render={({ field }) => (
                    <FormItem className="w-full text-left">
                      <Label>Banco</Label>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un banco" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={Banco.BPA}>BPA</SelectItem>
                          <SelectItem value={Banco.BANDEC}>BANDEC</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="saldo_inicial"
                render={({ field }) => (
                  <FormItem className="w-full text-left">
                    <Label>Saldo inicial</Label>
                    <FormControl>
                      <Input {...field} type="number" step={0.01} min={0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moneda"
                render={({ field }) => (
                  <FormItem className="w-full text-left">
                    <Label>Moneda</Label>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Moneda.CUP}>CUP</SelectItem>
                        <SelectItem value={Moneda.USD}>USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
