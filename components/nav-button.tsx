"use client";

import { Route } from "next";
import { SidebarMenuButton } from "./ui/sidebar";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface NavButtonProps {
  title: string;
  url: Route;
  children: ReactNode;
}

export function NavButton({ children, title, url }: NavButtonProps) {
  const pathname = usePathname();
  const isActive = url === pathname;
  return (
    <SidebarMenuButton tooltip={title} isActive={isActive}>
      {children}
      <span>{title}</span>
    </SidebarMenuButton>
  );
}
