import * as React from "react";
import { ClipboardCheck, LifeBuoy, LucideIcon } from "lucide-react";

import { NavMain } from "@/components/nav-main";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Route } from "next";
import { AreaVenta } from "@/app/(with-layout)/areas-de-venta/types";
import { NavUser } from "./nav-user";
import { NavSecondary } from "./nav-seconday";
import { UrlObject } from "url";
import { getSession } from "@/lib/getSession";

export interface SideBarItems {
  user: { username: string };
  navSecondary: {
    title: string;
    url: Route | UrlObject;
    icon: LucideIcon;
    target?: React.HTMLAttributeAnchorTarget;
  }[];
}

export async function AppSidebar({
  areas,
  ...props
}: React.ComponentProps<typeof Sidebar> & { areas: AreaVenta[] }) {
  const session = await getSession();

  const data: SideBarItems = {
    user: {
      username: "shadcn",
    },
    navSecondary: [
      {
        title: "Soporte",
        url: "https://mail.google.com/mail/?view=cm&fs=1&to=rethinksoftwarelab@gmail.com&su=PETICIÓN%20DE%20SOPORTE",
        icon: LifeBuoy,
        target: "_blank",
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="[&>svg]:size-6 hover:bg-transparent group-data-[collapsible=icon]:ml-1 group-data-[collapsible=icon]:h-8"
            >
              <Link href="/">
                <ClipboardCheck />
                <span>Panel de administración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          areas={areas}
          userRol={session?.user.rol}
          userAreaVenta={session?.user.area_venta}
        />

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
