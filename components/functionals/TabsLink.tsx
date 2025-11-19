"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Items {
  href: string;
  name: string;
}

export function TabsLink({ items }: { items: Items[] }) {
  const pathname = usePathname();

  return (
    <div className="mt-4 md:mt-6 px-4 bg-white w-full pb-[0.6rem] border-b">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href as __next_route_internal_types__.RouteImpl<string>}
          className={cn(
            "p-2 border-b-[3px] border-b-white bg-white text-sm text-black/80",
            pathname === item.href && "border-b-foreground text-black"
          )}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}
