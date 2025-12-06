import { TabsLink } from "@/components/functionals/TabsLink";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSession } from "@/lib/getSession";
import { LogOut, User } from "lucide-react";
import { ROLES } from "../users/types";
import { logout } from "@/lib/actions";

const items = [
  { href: "/cafeteria/inventario", name: "Inventario" },
  { href: "/cafeteria/ingredientes", name: "Ingredientes" },
  { href: "/cafeteria/ventas", name: "Ventas" },
];

export default async function LayoutCafeteria(
  props: LayoutProps<"/cafeteria">
) {
  const session = await getSession();
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex justify-between items-center px-6 pt-6 pb-0">
        <h1 className="text-lg font-semibold md:text-2xl">Cafetería</h1>
        {session?.user.rol === ROLES.VENDEDOR_CAFETERIA && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <form action={logout}>
                <DropdownMenuItem asChild className="flex items-center gap-1">
                  <button type="submit">
                    <LogOut className="size-4" />
                    <span> Cerrar sesión</span>
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <TabsLink items={items} />
      <div className="p-4 bg-muted/80 h-full">{props.children}</div>
    </main>
  );
}
