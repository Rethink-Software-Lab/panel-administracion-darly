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
import { CircleX, Pen, PlusCircle } from "lucide-react";
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
import { ProductosCafeteriaSchema } from "@/lib/schemas";

import { Input } from "@/components/ui/input";
import { InferInput, InferOutput } from "valibot";
import { toast } from "sonner";
import { useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  addProductoCafeteria,
  editProductoCafeteria,
} from "@/app/(with-layout)/(almacen-cafeteria)/productos-cafeteria/actions";
import { ProductoCafeteria } from "@/app/(with-layout)/(almacen-cafeteria)/productos-cafeteria/types";
import { Switch } from "@/components/ui/switch";

export default function SheetProductosCafeteria({
  data,
}: {
  data?: ProductoCafeteria;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<InferInput<typeof ProductosCafeteriaSchema>>({
    resolver: valibotResolver(ProductosCafeteriaSchema),
    defaultValues: {
      nombre: data?.nombre || "",
      precioCosto: data?.precioCosto?.toString() || "0",
      precioVenta: data?.precioVenta?.toString() || "0",
      isIngrediente: data?.isIngrediente || false,
    },
  });

  const onSubmit = async (
    dataForm: InferOutput<typeof ProductosCafeteriaSchema>
  ): Promise<void> => {
    const { data: dataRes, error } = data
      ? await editProductoCafeteria(dataForm, data.id)
      : await addProductoCafeteria(dataForm);

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
          <SheetTitle>{data ? "Editar" : "Agregar"} producto</SheetTitle>
          <SheetDescription className="pb-4">
            Rellene el formulario para agregar un producto.
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
                name="precioCosto"
                render={({ field }) => (
                  <FormItem className="w-full text-left">
                    <Label>Precio de costo</Label>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="precioVenta"
                render={({ field }) => (
                  <FormItem className="w-full text-left">
                    <Label>Precio de venta</Label>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isIngrediente"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between px-1">
                    <Label>Es ingrediente?</Label>
                    <FormControl>
                      <Switch
                        style={{ marginTop: 0 }}
                        onCheckedChange={field.onChange}
                        checked={field.value}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit">{data ? "Editar" : "Agregar"}</Button>
              </div>
            </form>
          </Form>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
