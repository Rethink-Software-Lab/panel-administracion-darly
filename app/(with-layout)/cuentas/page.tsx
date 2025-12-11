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
import { PopoverSaldos } from "@/components/popover-saldos";
import { Skeleton } from "@/components/ui/skeleton";
import { Zelle } from "@/components/ui/icons/zelle";

const MAX_TRANF_MES = 120000;

export default async function Tarjetas(props: PageProps<"/cuentas">) {
  await searchParamsCache.parse(props.searchParams);
  const { data, error } = await GetTarjetas();

  return (
    <main className="flex flex-1 flex-col gap-4 py-4 lg:gap-6 lg:py-6 h-full">
      <div className="flex justify-between items-center px-6">
        <h1 className="text-lg font-semibold md:text-2xl">Cuentas</h1>
        <Suspense fallback={<Skeleton className="w-20 h-5" />}>
          <PopoverSaldos />
        </Suspense>
      </div>
      <div
        className="w-full h-[250px] flex overflow-x-auto contain-strict overflow-y-hidden px-4 scroll-p-4 gap-4"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {data?.tarjetas?.map((tarjeta) => (
          <Card
            key={tarjeta.id}
            style={{ scrollSnapAlign: "start" }}
            className={cn(
              "flex flex-col aspect-video h-full bg-gradient-to-br  text-white from-blue-600 to-blue-800",
              tarjeta.banco === Banco.BANDEC && "from-[#6c0207] to-[#bc1f26]",
              tarjeta.banco === Banco.BPA && "from-[#1d6156] to-[#1d6156]",
              tarjeta.tipo === TipoCuenta.ZELLE && "from-[#a0f] to-[#6534D1]"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                {tarjeta.tipo === TipoCuenta.ZELLE ? (
                  <Zelle size={32} withBg={false} className="-ml-2" />
                ) : (
                  <div />
                )}
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
              </div>
              <CardTitle>{tarjeta.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">
                {Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: tarjeta.moneda,
                  currencyDisplay: "code",
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
