import "@/styles/globals.css";

import SideBar from "@/components/functionals/SideBar";
import TopBar from "@/components/functionals/TopBar";

import { getSession } from "@/lib/getSession";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Facebook } from "lucide-react";
import Link from "next/link";
import { getAreasVentas } from "./areas-de-venta/services";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default async function RootLayout(props: LayoutProps<"/">) {
  const session = await getSession();
  const { data } = await getAreasVentas();

  return (
    <>
      <div className="flex min-h-screen max-w-full box-content w-full">
        <SideBar areasVenta={data || []} session={session} />
        <div className="flex flex-col w-full">
          <TopBar session={session} areasVenta={data || []} />
          <NuqsAdapter>{props.children}</NuqsAdapter>
        </div>
      </div>
      <footer className="py-6 md:px-8 md:py-0 col-span-2 border">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <Button className="gap-1 font-medium" variant="ghost">
            <BrainCircuit />
            Rethink Software Lab
          </Button>
          <div className="flex items-center gap-1">
            <Link
              target="blank"
              href="https://www.facebook.com/profile.php?id=61559914711618"
            >
              <Button
                variant="outline"
                className="text-muted-foreground"
                size="icon"
              >
                <Facebook size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
