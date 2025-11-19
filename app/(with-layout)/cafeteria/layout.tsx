import { TabsLink } from "@/components/functionals/TabsLink";

const items = [
  { href: "/cafeteria/inventario", name: "Inventario" },
  { href: "/cafeteria/ingredientes", name: "Ingredientes" },
  { href: "/cafeteria/ventas", name: "Ventas" },
];

export default async function LayoutCafeteria(
  props: LayoutProps<"/cafeteria">
) {
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex justify-between items-center px-6 pt-6 pb-0">
        <h1 className="text-lg font-semibold md:text-2xl">Cafetería</h1>
      </div>
      <TabsLink items={items} />
      <div className="p-4 bg-muted/80 h-full">{props.children}</div>
    </main>
  );
}
