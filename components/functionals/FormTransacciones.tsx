"use client";

import { Button } from "@/components/ui/button";
import { ArrowDownLeft, ArrowUpRight, CircleX, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { TransferenciasTarjetas } from "@/app/(with-layout)/finanzas/transacciones/schema";

import { Input } from "@/components/ui/input";
import { InferInput, InferOutput } from "valibot";
import { toast } from "sonner";
import { useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Banco,
  CuentasInTransaccionesCompanent,
  TipoCuenta,
  TipoTransferencia,
} from "@/app/(with-layout)/finanzas/transacciones/types";
import { addTransferenciaTarjeta } from "@/app/(with-layout)/finanzas/transacciones/actions";
import { cn } from "@/lib/utils";

export function FormTransacciones({
  tarjetas,
  setOpen,
}: {
  tarjetas: CuentasInTransaccionesCompanent[] | undefined;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<InferInput<typeof TransferenciasTarjetas>>({
    resolver: valibotResolver(TransferenciasTarjetas),
    defaultValues: {
      descripcion: "",
      tipo: undefined,
      cantidad: "0",
      cuenta: undefined,
    },
  });

  const onSubmit = async (
    dataForm: InferOutput<typeof TransferenciasTarjetas>
  ): Promise<void> => {
    setLoading(true);
    setError("");
    const { data: dataRes, error } = await addTransferenciaTarjeta(dataForm);
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
  return (
    <>
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
            name="tipo"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <Label>Tipo</Label>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TipoTransferencia.INGRESO}>
                      <div className="flex items-center gap-2">
                        <ArrowDownLeft className="text-green-500" />
                        Ingreso
                      </div>
                    </SelectItem>
                    <SelectItem value={TipoTransferencia.EGRESO}>
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="text-red-500" />
                        Egreso
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cuenta"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <Label>Cuenta</Label>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una cuenta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tarjetas?.map((tarjeta) => (
                      <SelectItem
                        key={tarjeta.id}
                        value={tarjeta.id.toString()}
                      >
                        <div className="flex gap-2 items-center ">
                          <div
                            className={cn(
                              "w-6 aspect-square rounded-full bg-gradient-to-br",
                              tarjeta.banco === Banco.BANDEC &&
                                "from-[#6c0207] to-[#bc1f26]",
                              tarjeta.banco === Banco.BPA &&
                                "from-[#1d6156] to-[#1d6156]",
                              tarjeta.tipo === TipoCuenta.EFECTIVO &&
                                "from-blue-500 to-blue-700",
                              tarjeta.tipo === TipoCuenta.ZELLE &&
                                "from-[#a0f] to-[#6534D1]"
                            )}
                          ></div>
                          <p>{tarjeta.nombre}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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
            name="cantidad"
            render={({ field }) => (
              <FormItem className="w-full text-left">
                <Label>Valor</Label>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step={0.01}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button disabled={loading} type="submit" className="gap-2">
              {loading && <Loader2 className="animate-spin size-4" />}
              {loading ? "Agregando..." : "Agregar"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
