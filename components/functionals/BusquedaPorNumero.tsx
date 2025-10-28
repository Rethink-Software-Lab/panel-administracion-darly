"use client";

import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogClose,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Tag, TagInput } from "emblor";
import { InferInput } from "valibot";
import { searchByNumberSchema } from "@/lib/schemas";
import { useState } from "react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useRouter } from "next/navigation";

export function BusquedaPorNumero() {
  const form = useForm<InferInput<typeof searchByNumberSchema>>({
    resolver: valibotResolver(searchByNumberSchema),
    defaultValues: {
      numeros: [],
    },
  });

  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { setValue } = form;

  const onSubmit = (dataForm: InferInput<typeof searchByNumberSchema>) => {
    const stringNumber = dataForm.numeros.map((item) => item.text).join(",");
    router.push(`/search?n=${stringNumber}`);
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon" title="Búsqueda por número">
          <Hash className="h-5 w-5" />
          <span className="sr-only">Búsqueda por número</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buscar por números</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="numeros"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start">
                  <FormControl>
                    <TagInput
                      {...field}
                      placeholder="Ingrese los números"
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
                        setValue("numeros", newTags as [Tag, ...Tag[]]);
                      }}
                      validateTag={(tag) => !!Number(tag)}
                      activeTagIndex={activeTagIndex}
                      setActiveTagIndex={setActiveTagIndex}
                    />
                  </FormControl>
                  <FormDescription>
                    Agregue los números separandolos por coma o enter
                  </FormDescription>
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
                <Button type="submit" className="w-full">
                  Buscar
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
