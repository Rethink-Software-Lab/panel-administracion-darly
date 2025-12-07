"use client";

import {
  ChevronRight,
  Cog,
  FileChartColumn,
  GitCompareArrows,
  Home,
  LucideIcon,
  Package,
  Store,
  Users,
  Warehouse,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Route } from "next";
import Link from "next/link";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { AreaVenta } from "@/app/(with-layout)/areas-de-venta/types";
import { NavButton } from "./nav-button";
import { NavSubButton } from "./nav-sub-button";
import { NavVendedor } from "./nav-vendedor";
import { ROLES } from "@/app/(with-layout)/users/types";

export interface NavMainLink {
  title: string;
  icon: LucideIcon;
  url: Route;
  items?: never;
}

export type NestedNavItem =
  | {
      title: string;
      url: Route;
      items?: never;
    }
  | {
      title: string;
      url?: never;
      items: { title: string; url: Route }[];
    };

interface NavMainGroup {
  title: string;
  icon: LucideIcon;
  isActive: boolean;
  items: NestedNavItem[];
  url?: never;
}

type NavMainItem = NavMainLink | NavMainGroup;

export function NavMain({
  areas,
  userRol,
  userAreaVenta,
}: {
  areas: AreaVenta[];
  userRol: ROLES | undefined;
  userAreaVenta: number | undefined;
}) {
  const pathname = usePathname();

  if (userRol === ROLES.VENDEDOR && userAreaVenta)
    return <NavVendedor areas={areas} userAreaVenta={userAreaVenta} />;

  const productosItems: NestedNavItem[] = [
    {
      title: "Productos Salon y Mesas",
      url: "/products",
    },
    {
      title: "Productos Cafetería",
      url: "/productos-cafeteria",
    },
    {
      title: "Elaboraciones",
      url: "/elaboraciones",
    },
    {
      title: "Categorías",
      url: "/categorias",
    },
    {
      title: "Merma",
      url: "/merma",
    },
  ];

  const almacenesItems: NestedNavItem[] = [
    {
      title: "Almacen Salon",
      items: [
        { title: "Inventario", url: "/inventario" },
        { title: "Entradas", url: "/entradas" },
        { title: "Salidas", url: "/salidas" },
      ],
    },
    {
      title: "Almacen Revoltosa",
      items: [
        { title: "Inventario", url: "/inventario-revoltosa" },
        { title: "Salidas", url: "/salidas-revoltosa" },
      ],
    },
    {
      title: "Almacen Cafeteria",
      items: [
        { title: "Inventario", url: "/inventario-cafeteria" },
        { title: "Entradas", url: "/entradas-cafeteria" },
        { title: "Salidas", url: "/salidas-cafeteria" },
      ],
    },
  ];

  const operacionesItems: NestedNavItem[] = [
    {
      title: "Proveedores",
      url: "/proveedores",
    },
    {
      title: "Gastos",
      url: "/gastos",
    },
    {
      title: "Cuenta Casa",
      url: "/cuenta-casa",
    },
    {
      title: "Cuentas",
      url: "/cuentas",
    },
    {
      title: "Transferencias",
      url: "/transferencias",
    },
    {
      title: "Ajuste Inventario",
      url: "/ajuste-inventario",
    },
  ];

  const navMain: NavMainItem[] = [
    {
      title: "Inicio",
      url: "/",
      icon: Home,
    },
    {
      title: "Usuarios",
      url: "/users",
      icon: Users,
    },
    { title: "Reportes", icon: FileChartColumn, url: "/reportes" },
    {
      title: "Productos",
      icon: Package,
      isActive: !!productosItems.find((i) => "url" in i && i.url === pathname),
      items: productosItems,
    },
    {
      title: "Almacenes",
      icon: Warehouse,
      isActive: !!almacenesItems.find(
        (i) => "items" in i && i.items?.find((a) => a.url === pathname)
      ),
      items: almacenesItems,
    },
    {
      title: "Operaciones",
      icon: GitCompareArrows,
      isActive: !!operacionesItems.find(
        (i) => "url" in i && i.url === pathname
      ),
      items: operacionesItems,
    },
    {
      title: "Áreas de venta",
      icon: Store,
      isActive: !!areas.find(
        (i) =>
          `/areas-de-venta/${i.id}` === pathname ||
          "/cafeteria/inventario" === pathname
      ),
      items: [
        { title: "Cafeteria", url: "/cafeteria/inventario" },
        ...areas.map((a) => ({
          title: a.nombre,
          url: `/areas-de-venta/${a.id}` as Route,
        })),
      ],
    },
    {
      title: "Configuración",
      icon: Cog,
      isActive: pathname === "/areas-de-venta",
      items: [{ title: "Administar areas de venta", url: "/areas-de-venta" }],
    },
  ];
  return (
    <SidebarGroup className="pt-0">
      <SidebarMenu>
        {navMain.map((item) =>
          !item.items ? (
            <SidebarMenuItem key={item.title}>
              <Link href={item.url}>
                <NavButton title={item.title} url={item.url}>
                  {item.icon && <item.icon />}
                </NavButton>
              </Link>
            </SidebarMenuItem>
          ) : (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="transition-transform duration-500 ease-in-out">
                  <SidebarMenuSub>
                    {item.items?.map((subItem) =>
                      subItem.items ? (
                        <SubNav key={subItem.title} item={subItem} />
                      ) : (
                        <SidebarMenuSubItem key={subItem.title}>
                          <NavSubButton item={subItem} />
                        </SidebarMenuSubItem>
                      )
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function SubNav({
  item,
}: {
  item: { title: string; url?: never; items: { title: string; url: Route }[] };
}) {
  const pathname = usePathname();
  const isActive = !!item.items?.find((sub) => sub.url === pathname);

  return (
    <Collapsible
      key={item.title}
      className="group/collapsible"
      defaultOpen={isActive}
    >
      <CollapsibleTrigger className="w-full">
        <SidebarMenuSubButton>
          {item.title}
          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
        </SidebarMenuSubButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {item.items.map((nestedItem) => (
            <SidebarMenuSubItem key={nestedItem.title}>
              <NavSubButton item={nestedItem} />
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}
