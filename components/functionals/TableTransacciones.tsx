import { CloudOff } from "lucide-react";
import SheetTransferenciasTarjetas from "./sheets/SheetTransferenciasTarjetas";
import { getTransacciones } from "@/app/(with-layout)/cuentas/services";
import { columns } from "@/app/(with-layout)/cuentas/columns";
import DataTableTransacciones from "./data-tables/transacciones/data-table-transacciones";
import { Tarjetas } from "@/app/(with-layout)/cuentas/types";

export async function TableTransacciones({ cuentas }: { cuentas: Tarjetas[] }) {
  const { data, error, meta } = await getTransacciones();

  return (
    <div className="p-4 m-0 bg-muted/40 h-full border-t-2 border-muted">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold md:text-xl">Transacciones</h1>
        <SheetTransferenciasTarjetas tarjetas={data?.cuentas || []} />
      </div>
      {data && meta ? (
        <DataTableTransacciones
          columns={columns}
          data={data.transacciones}
          cuentas={cuentas}
          {...meta}
        />
      ) : (
        <div className="flex py-40 flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <CloudOff size={72} className="inline-flex mb-4" />
            <h3 className="text-2xl font-bold tracking-tight">{error}</h3>
            <p className="text-sm text-muted-foreground">
              Estamos presentando un error, por favor intente nuevamente. Si el
              problema persiste, contacta con soporte.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
