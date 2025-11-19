import DataTable from "@/components/functionals/data-tables/data-table-general";
import { columns } from "./columns";
import { ProductoCafeteria } from "../types";
import { ingredientesCafeteria } from "./services";

export default async function InventarioAreaCafeteria() {
  const { data } = await ingredientesCafeteria();
  return <DataTable<ProductoCafeteria> columns={columns} data={data} />;
}
