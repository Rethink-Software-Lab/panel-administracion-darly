import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getReporteVentasAreaVenta } from "./services";

export default async function areaVentaReporte(
  props: PageProps<"/areas-de-venta/[id]/reporte">
) {
  const paramId = (await props.params).id;
  const areaVentaId = parseInt(paramId);

  if (isNaN(areaVentaId)) return;

  const { data, error } = await getReporteVentasAreaVenta(areaVentaId);

  if (!data) return;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-semibold">Tu cobro</h2>
        <span className="font-semibold">
          {Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "CUP",
            currencyDisplay: "code",
          }).format(data?.pagoTrabajador)}
        </span>
      </div>
      <div className="bg-white rounded border px-2">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="text-end">
                {Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "CUP",
                  currencyDisplay: "code",
                }).format(data?.total)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Efectivo</TableCell>
              <TableCell className="text-end">
                {Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "CUP",
                  currencyDisplay: "code",
                }).format(data?.efectivo)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Transferencia</TableCell>
              <TableCell className="text-end">
                {Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "CUP",
                  currencyDisplay: "code",
                }).format(data?.transferencia)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="bg-white rounded border px-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-end">Cantidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.productos.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.descripcion}</TableCell>
                <TableCell className="text-end">
                  {Intl.NumberFormat().format(p.cantidad)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
