import "@/app/globals.css";

import TopBar from "@/components/functionals/TopBar";

import { getSession } from "@/lib/getSession";
import { getAreasVentas } from "./areas-de-venta/services";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Footer } from "@/components/footer";
import { ROLES } from "./users/types";

export default async function RootLayout(props: LayoutProps<"/">) {
  const { data } = await getAreasVentas();
  const session = await getSession();

  if (session?.user.rol === ROLES.VENDEDOR_CAFETERIA)
    return (
      <NuqsAdapter>
        <main className="h-full">{props.children}</main>
      </NuqsAdapter>
    );

  return (
    <>
      <SidebarProvider>
        <AppSidebar areas={data?.areas || []} />
        <SidebarInset className="flex flex-col min-h-max">
          <TopBar />

          <NuqsAdapter>{props.children}</NuqsAdapter>
          <Footer />
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
