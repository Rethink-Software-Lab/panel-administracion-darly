import { TabsLink } from "@/components/functionals/TabsLink";
import { getAreaVenta } from "./services";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function LayoutAreaVenta(
  props: LayoutProps<"/areas-de-venta/[id]">
) {
  const params = await props.params;
  const items = [
    { href: `/areas-de-venta/${params.id}/inventario`, name: "Inventario" },
    { href: `/areas-de-venta/${params.id}/zapatos`, name: "Zapatos" },
    { href: `/areas-de-venta/${params.id}/ventas`, name: "Ventas" },
  ];
  return (
    <div>
      <div className="px-6 pt-6 md:pt-8 pb-2 md:pb-4">
        <Suspense fallback={<Skeleton className="h-5 w-44" />}>
          <HeaderAreaVenta areaId={params.id} />
        </Suspense>
      </div>
      <TabsLink items={items} />
      <div className="p-4 bg-muted/80 h-full">{props.children}</div>
    </div>
  );
}

async function HeaderAreaVenta({ areaId }: { areaId: string }) {
  const { data, error } = await getAreaVenta(parseInt(areaId));

  if (error || !data) {
    return (
      <h1 className="text-lg font-semibold md:text-2xl">
        Error al cargar el nombre.
      </h1>
    );
  }

  return <h1 className="text-lg font-semibold md:text-2xl">{data.nombre}</h1>;
}
