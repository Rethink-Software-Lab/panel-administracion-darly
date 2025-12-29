import { Suspense } from "react";
import { PopoverSaldos } from "@/components/popover-saldos";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsLink } from "@/components/functionals/TabsLink";

const items = [
  { href: "/finanzas/cuentas", name: "Cuentas" },
  { href: "/finanzas/transacciones", name: "Transacciones" },
];

export default async function LayoutFinanzas(props: LayoutProps<"/finanzas">) {
  return (
    <main className="flex flex-1 flex-col gap-4 py-4 lg:gap-6 lg:py-6 h-full">
      <div className="flex justify-between items-center px-6">
        <h1 className="text-lg font-semibold md:text-2xl">Finanzas</h1>
        <Suspense fallback={<Skeleton className="w-20 h-5" />}>
          <PopoverSaldos />
        </Suspense>
      </div>
      <TabsLink items={items} />
      {props.children}
    </main>
  );
}
