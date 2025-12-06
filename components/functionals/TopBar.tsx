import { NoRepresentados } from "./NoRepresentados";
import { SearchCommand } from "./search-command";
import { getProductosToSearch } from "@/app/(with-layout)/services";
import { BusquedaPorNumero } from "@/components/functionals/BusquedaPorNumero";
import { SidebarTrigger } from "../ui/sidebar";

export default async function TopBar() {
  const { data: productos } = await getProductosToSearch();

  return (
    <header className="sticky top-0 flex justify-between h-14 items-center gap-2 border-b bg-sidebar z-40 px-4 lg:h-[60px] lg:px-6">
      <SidebarTrigger />
      <div className="flex flex-1 gap-2 justify-end">
        <SearchCommand productos={productos || []} />

        <BusquedaPorNumero />

        <NoRepresentados />
      </div>
    </header>
  );
}
