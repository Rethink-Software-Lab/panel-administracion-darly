import { forbidden } from "next/navigation";
import { getInventarioAreaVenta } from "./services";
import { DataTable } from "@/components/ui/data-table-inventario-almacen-2";
import { columns } from "./columns";

export default async function InventarioAreaVenta(
  props: PageProps<"/areas-de-venta/[id]/inventario">
) {
  const id_param = (await props.params).id;
  const id = parseInt(id_param);

  if (isNaN(id)) {
    forbidden();
  }

  const { data, error } = await getInventarioAreaVenta(id);
  return (
    <DataTable
      columns={columns}
      data={data?.productos}
      categorias={data?.categorias}
    />
  );
}
