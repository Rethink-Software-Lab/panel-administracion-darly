"use client";

import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ResponseSearchProducts } from "@/app/(with-layout)/types";
import { Input } from "../ui/input";

const cmdkFilter = (value: string, search: string): number => {
  const valueLower = value.toLowerCase();
  const searchLower = search.toLowerCase();
  let searchIndex = 0;
  for (let i = 0; i < valueLower.length; i++) {
    if (valueLower[i] === searchLower[searchIndex]) {
      searchIndex++;
    }
    if (searchIndex === searchLower.length) {
      return 1;
    }
  }
  return 0;
};

const getRelevanceScore = (value: string, search: string): number => {
  const valueLower = value.toLowerCase();
  const searchLower = search.toLowerCase();
  if (valueLower.startsWith(searchLower)) return 100;
  if (valueLower.includes(` ${searchLower}`)) return 90;
  if (valueLower.includes(searchLower))
    return 80 - valueLower.indexOf(searchLower);
  return 1;
};

export function SearchCommand({
  productos,
}: {
  productos: ResponseSearchProducts[];
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredAndSortedProductos = useMemo(() => {
    const trimmedQuery = inputValue.replace(/\s+/g, " ").trim();
    if (!trimmedQuery) {
      return productos;
    }
    const searchWords = trimmedQuery.split(" ");
    const filtered = productos.filter((p) => {
      return searchWords.every((word) => cmdkFilter(p.nombre, word));
    });
    return filtered.sort((a, b) => {
      const scoreA = searchWords.reduce(
        (score, word) => score + getRelevanceScore(a.nombre, word),
        0
      );
      const scoreB = searchWords.reduce(
        (score, word) => score + getRelevanceScore(b.nombre, word),
        0
      );
      return scoreB - scoreA;
    });
  }, [productos, inputValue]);

  useEffect(() => {
    if (filteredAndSortedProductos.length > 0) {
      setSelectedValue(filteredAndSortedProductos[0].id.toString());
    } else {
      setSelectedValue("");
    }
  }, [filteredAndSortedProductos]);

  const handleSelectProduct = (p: ResponseSearchProducts) => {
    const params = new URLSearchParams();
    if (p.isCafeteria) params.append("isCafeteria", "true");
    router.push(`/search/${p.id}?${params.toString()}`);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="secondary"
        title="Buscar"
        size="icon"
        onClick={() => setOpen(true)}
      >
        <Search size={18} />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        value={selectedValue}
        onValueChange={setSelectedValue}
      >
        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Busca productos..."
            className="flex border-none focus-visible:ring-0 h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup heading="Sugerencias">
            {filteredAndSortedProductos.map((p, index) => (
              <CommandItem
                key={`p.id-${index}`}
                onSelect={() => handleSelectProduct(p)}
                className="gap-2 cursor-pointer"
              >
                <span>{p.nombre}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
