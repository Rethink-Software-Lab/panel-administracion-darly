import DataTable from "./data-table";
import { columns } from "./columns";
import { ventasCafeteria } from "./services";
import { type VentasCafeteria } from "../types";
import { searchParamsCache } from "./searchParams";
import SheetVentasCafeteria from "@/components/functionals/sheets/SheetVentasCafeteria";

export default async function VentasCafeteria(
  props: PageProps<"/cafeteria/ventas">
) {
  await searchParamsCache.parse(props.searchParams);
  const { data, meta } = await ventasCafeteria();
  if (!meta) return <div>No se encontraron ventas.</div>;

  return (
    <>
      <div className="flex justify-end mb-4">
        <SheetVentasCafeteria
          productos={data?.productos_elaboraciones}
          cuentasBancarias={data?.tarjetas}
        />
      </div>
      <DataTable
        columns={columns}
        data={data.ventas}
        meta={meta}
        productos_elaboraciones={data?.productos_elaboraciones}
        cuentasBancarias={data?.tarjetas}
      />
    </>
  );
}
