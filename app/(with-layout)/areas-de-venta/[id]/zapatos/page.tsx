import { forbidden } from "next/navigation";
import DataTableZapatos from "@/components/functionals/data-tables/data-table-zapatos";
import { getInventarioZapatosAreaVenta } from "./services";
import { Zapatos } from "../types";
import { columns } from "./columns";

export default async function inventarioZapatosAreaVenta(
  props: PageProps<"/areas-de-venta/[id]/zapatos">
) {
  const id_param = (await props.params).id;
  const id = parseInt(id_param);

  if (isNaN(id)) {
    forbidden();
  }

  const { data, error } = await getInventarioZapatosAreaVenta(id);

  return <DataTableZapatos<Zapatos> columns={columns} data={data} />;
}
