import { columns } from "./columns";
import DataTableCuentas from "./data-table";
import { getCuentas } from "./services";

export default async function Cuentas() {
  const { data, error } = await getCuentas();

  if (error) return;

  return (
    <div className="px-4">
      <DataTableCuentas data={data} columns={columns} />
    </div>
  );
}
