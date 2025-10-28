import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Fragment } from "react";
import { PackageOpen } from "lucide-react";

interface ProductoInInventarioSearch {
  id: number;
  color: string;
  numero: number;
}

export type InventarioSearch = {
  area: string;
} & (
  | {
      cantidad: number;
      productos?: never;
    }
  | {
      cantidad?: never;
      productos: ProductoInInventarioSearch[];
    }
);

export function SearchDisponibles({
  info,
  zapato: isZapato,
  inventario,
}: {
  info: {
    id: number;
    imagen: string | null;
    descripcion: string;
    precio_costo: string;
    precio_venta: string;
  };
  zapato: boolean;
  inventario: InventarioSearch[];
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      {inventario && inventario.length > 0 ? (
        isZapato ? (
          inventario.map((res) => (
            <Fragment key={res.area}>
              <h2 className="font-bold pb-2">{res.area}</h2>
              <Table className="mb-6">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Id</TableHead>
                    <TableHead className="font-bold">Número</TableHead>
                    <TableHead className="font-bold">Color</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {res.productos &&
                    res.productos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.id}</TableCell>
                        <TableCell>{p.numero}</TableCell>
                        <TableCell>{p.color}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={info ? 2 : 3} className="font-bold">
                      Total
                    </TableCell>
                    <TableCell>
                      {res.productos && res?.productos.length}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </Fragment>
          ))
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Área</TableHead>
                <TableHead className="font-bold">Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventario.map((res) => (
                <TableRow key={res.area}>
                  <TableCell>{res.area}</TableCell>
                  <TableCell>{res.cantidad}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : (
        <div className="flex items-center gap-4 py-8 px-12 justify-center">
          <PackageOpen className="w-20 h-20" strokeWidth={1} />
          <div>
            <h2 className="text-lg font-semibold">
              No existe inventario de este producto.
            </h2>
            <p className="text-muted-foreground">
              Cuando haya inventario aparecerá aquí.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
