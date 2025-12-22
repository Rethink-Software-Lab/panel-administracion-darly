import { forbidden } from "next/navigation";
import { getVentasAreaVenta } from "./services";
import { DataTableVentasAreaVenta } from "./data-table";
import { columns } from "./colums";
import { getSession } from "@/lib/getSession";
import ModalVentas from "@/components/functionals/ModalVentas";
import { searchParamsCache } from "./searchParams";

export default async function VentasAreaVenta(
  props: PageProps<"/areas-de-venta/[id]/ventas">
) {
  const id_param = (await props.params).id;
  const id = parseInt(id_param);

  const session = await getSession();

  await searchParamsCache.parse(props.searchParams);
  const { data, meta, error } = await getVentasAreaVenta(id);

  if (isNaN(id) || !data.area_venta) {
    forbidden();
  }

  if (error) {
    throw new Error(error);
  }

  const productosParaModal =
    data?.allProductos
      ?.filter((p) => p.disponible === true)
      .map((p) => {
        const { disponible, ...rest } = p;
        return rest;
      }) ?? [];

  return (
    <div className="space-y-4">
      <DataTableVentasAreaVenta
        meta={meta}
        columns={columns}
        data={data?.ventas}
        productos={data.allProductos}
        userId={session?.user.id || 0}
        isStaff={session?.isStaff || false}
      >
        <ModalVentas
          areaVenta={data?.area_venta}
          productosInfo={productosParaModal}
          cuentasBancarias={data?.cuentas_bancarias}
        />
      </DataTableVentasAreaVenta>
    </div>
  );
}
