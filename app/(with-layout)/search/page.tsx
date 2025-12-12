import { CloudOff, SearchX } from "lucide-react";
import { forbidden } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { searchProduct } from "@/app/(with-layout)/search/services";
import { searchParamsCache } from "@/app/(with-layout)/search/searchParams";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function Search(props: PageProps<"/search">) {
  const searchParamsCacheValues = await searchParamsCache.parse(
    props.searchParams
  );

  if (!searchParamsCacheValues.n || searchParamsCacheValues.n.length === 0) {
    forbidden();
  }

  const { data: productos, error } = await searchProduct();

  if (error) {
    return (
      <main className="flex flex-1 flex-col gap-4 lg:gap-6">
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <CloudOff size={72} className="inline-flex mb-4" />
            <h3 className="text-2xl font-bold tracking-tight">
              Error al conectar
            </h3>
            <p className="text-sm text-muted-foreground">
              {error || "No se ha podido conectar con el servidor."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (productos?.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-16">
            <SearchX className="size-10" />
          </EmptyMedia>
          <EmptyTitle>Sin resultados para esta búsqueda.</EmptyTitle>
          <EmptyDescription>
            Los números que estás intentando buscar no están disponibles.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex flex-col gap-4">
        {productos.map((productoInfo) => (
          <div key={productoInfo.id} className="flex flex-col gap-2">
            <h3 className="font-semibold">{productoInfo.nombre}</h3>
            <div className="bg-muted/70 rounded-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 w-[100px]">Número</TableHead>
                    <TableHead className="text-right pr-4">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productoInfo.productos?.map((detalleProducto) => (
                    <TableRow key={detalleProducto.numero}>
                      <TableCell className="font-medium pl-4">
                        {detalleProducto.numero}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        {detalleProducto.cantidad}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
