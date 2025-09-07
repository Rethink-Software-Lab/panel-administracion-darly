import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GetTarjetas } from "./services";
import { EllipsisVertical } from "lucide-react";
import SheetTarjetas from "@/components/functionals/sheets/SheetTarjetas";
import { cn } from "@/lib/utils";
import { Banco, TipoCuenta } from "./types";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Delete from "./client";
import { Progress } from "@/components/ui/progress";
import { TableTransacciones } from "@/components/functionals/TableTransacciones";
import { Suspense } from "react";
import { SkeletonTransacciones } from "@/components/functionals/data-tables/transacciones/skeleton";
import { searchParamsCache } from "./searchParams";

const MAX_TRANF_MES = 120000;

export default async function Tarjetas(props: PageProps<"/cuentas">) {
  await searchParamsCache.parse(props.searchParams);
  const { data, error } = await GetTarjetas();

  return (
    <main className="flex flex-1 flex-col gap-4 py-4 lg:gap-6 lg:py-6 h-full">
      <div className="flex justify-between items-center px-6">
        <h1 className="text-lg font-semibold md:text-2xl">Cuentas</h1>
        {data?.total_balance && (
          <div className="flex gap-1 items-center">
            <p className="text-sm">Saldo total:</p>
            <p className="text-md font-semibold">
              {Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "CUP",
              }).format(data.total_balance)}
            </p>
          </div>
        )}
      </div>
      <div
        className="w-full h-[18rem] md:h-[16rem] flex overflow-x-auto p-4 scroll-p-4 gap-4 md:contain-strict"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {data?.tarjetas?.map((tarjeta) => (
          <Card
            key={tarjeta.id}
            style={{ flex: "0 0 auto", scrollSnapAlign: "start" }}
            className={cn(
              "w-80 bg-gradient-to-br  text-white aspect-video from-blue-600 to-blue-800",
              tarjeta.banco === Banco.BANDEC && "from-[#6c0207] to-[#bc1f26]",
              tarjeta.banco === Banco.BPA && "from-[#1d6156] to-[#1d6156]"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="line-clamp-1">{tarjeta.nombre}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <EllipsisVertical size={18} />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                  <DropdownMenuLabel>{tarjeta.nombre}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Delete id={tarjeta.id} />
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">
                {Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "CUP",
                }).format(Number(tarjeta.saldo))}
              </p>
            </CardContent>
            <CardFooter>
              {tarjeta.tipo === TipoCuenta.BANCARIA && (
                <div className="w-full">
                  <p className="text-xs text-right">
                    {Intl.NumberFormat("es-ES", {
                      style: "decimal",
                      maximumFractionDigits: 2,
                    }).format(tarjeta.total_transferencias_mes)}
                    /{MAX_TRANF_MES}
                  </p>
                  <Progress
                    className={cn(
                      "[&>div]:bg-white mt-2",
                      (tarjeta.total_transferencias_mes * 100) /
                        MAX_TRANF_MES >=
                        60 && "[&>div]:bg-yellow-400",
                      (tarjeta.total_transferencias_mes * 100) /
                        MAX_TRANF_MES >=
                        80 && "[&>div]:bg-red-600"
                    )}
                    value={
                      (tarjeta.total_transferencias_mes * 100) / MAX_TRANF_MES
                    }
                  />
                </div>
              )}
            </CardFooter>
          </Card>
        ))}

        <SheetTarjetas isError={!!error} />
      </div>
      <Suspense fallback={<SkeletonTransacciones />}>
        <TableTransacciones cuentas={data?.tarjetas || []} />
      </Suspense>
    </main>
  );
}
