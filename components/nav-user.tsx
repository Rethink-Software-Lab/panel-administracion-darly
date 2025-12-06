import { ChevronsUpDown, LogOut, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getSession } from "@/lib/getSession";
import { Badge } from "./ui/badge";
import { ROLES_NORM } from "@/lib/utils";
import { ROLES } from "@/app/(with-layout)/users/types";
import { logout } from "@/lib/actions";

async function UserComp() {
  const session = await getSession();

  return (
    <>
      <div className="p-2 bg-muted-foreground/20 rounded-lg group-data-[collapsible=icon]:p-1">
        <User className="size-6" />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight gap-1">
        <span className="truncate font-medium pl-1">
          {session?.user.username}
        </span>
        <Badge variant="outline" className="w-fit text-[10px]">
          {session &&
            (ROLES_NORM[session.user.rol as ROLES] ?? session.user.rol)}
        </Badge>
      </div>
    </>
  );
}

export async function NavUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserComp />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="bottom"
            align="center"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal flex gap-1">
              <UserComp />
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <form action={logout}>
              <DropdownMenuItem
                asChild
                className="cursor-pointer gap-2 [&>svg]:size-4 hover:bg-muted-foreground/20"
              >
                <button type="submit" className="w-full">
                  <LogOut />
                  Cerrar Sesión
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
