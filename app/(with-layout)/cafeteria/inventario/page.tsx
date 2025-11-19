import DataTable from "@/components/functionals/data-tables/data-table-general";
import { columns } from "./columns";
import { ProductoCafeteria } from "../types";
import { inventarioCafeteria } from "./services";

export default async function InventarioAreaCafeteria() {
  const { data } = await inventarioCafeteria();
  return <DataTable<ProductoCafeteria> columns={columns} data={data} />;
}
