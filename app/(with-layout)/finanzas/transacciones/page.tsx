import DataTableTransacciones from "@/app/(with-layout)/finanzas/transacciones/data-table";
import { columns } from "./columns";
import { getTransacciones } from "./services";
import { searchParamsCache } from "./searchParams";

export default async function Transacciones(
  props: PageProps<"/finanzas/transacciones">
) {
  const searchParams = await props.searchParams;
  await searchParamsCache.parse(searchParams);
  const { data, meta, error } = await getTransacciones();

  if (error || !data || !meta) return;

  return (
    <div className="px-4">
      <DataTableTransacciones
        columns={columns}
        data={data.transacciones}
        cuentas={data.cuentas}
        meta={meta}
      />
    </div>
  );
}
