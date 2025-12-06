"use client";

import {
  ChevronRight,
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
  SidebarGroupLabel,
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

export function NavVendedor({
  areas,
  userAreaVenta,
}: {
  areas: AreaVenta[];
  userAreaVenta: number;
}) {
  const pathname = usePathname();
  const tuArea = areas.find((a) => a.id === userAreaVenta);

  const navMain: NavMainItem[] = [
    {
      title: "Áreas de venta",
      icon: Store,
      isActive: !!areas
        .filter((a) => a.id !== userAreaVenta)
        .find((i) => `/areas-de-venta/${i.id}` === pathname),
      items: areas
        .filter((a) => a.id !== userAreaVenta)
        .map((a) => ({
          title: a.nombre,
          url: `/areas-de-venta/${a.id}` as Route,
        })),
    },
  ];
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Tú área</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href={`/areas-de-venta/${tuArea?.id}`}>
              <SidebarMenuButton
                tooltip={tuArea?.nombre}
                isActive={`/areas-de-venta/${tuArea?.id}` === pathname}
              >
                {tuArea?.nombre}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
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
    </>
  );
}
