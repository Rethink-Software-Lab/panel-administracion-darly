"use client";

import Link from "next/link";
import { SidebarMenuSubButton } from "./ui/sidebar";
import { Route } from "next";
import { usePathname } from "next/navigation";

interface NavSubButtonProps {
  item: { title: string; url: Route; items?: never; isActive?: boolean };
}

export function NavSubButton({ item }: NavSubButtonProps) {
  const pathname = usePathname();
  const isActive = item.isActive ?? item.url === pathname;

  return (
    <SidebarMenuSubButton asChild isActive={isActive}>
      <Link href={item.url}>{item.title}</Link>
    </SidebarMenuSubButton>
  );
}
