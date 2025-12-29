import { getSaldos } from "@/app/(with-layout)/finanzas/services";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Zelle } from "./ui/icons/zelle";
import { Separator } from "./ui/separator";

export async function PopoverSaldos() {
  const { data, error } = await getSaldos();

  if (error) {
    return (
      <div className="flex gap-1 items-center">
        Error al obtener los saldos.
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger>
        <div className="flex gap-2 items-center">
          <p className="text-sm">Saldo total:</p>
          <p className="text-md font-semibold">
            {Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "CUP",
              currencyDisplay: "code",
            }).format(data?.saldoTotal.CUP || 0)}
          </p>
          <p className="text-md font-semibold">
            {Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "USD",
              currencyDisplay: "code",
            }).format(data?.saldoTotal.USD || 0)}
          </p>
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="space-y-2">
        <div className="text-center pb-3">
          <p className="text-md font-semibold">
            {Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "CUP",
              currencyDisplay: "code",
            }).format(data?.saldoTotal.CUP || 0)}
          </p>
          <p className="text-md font-semibold">
            {Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "USD",
              currencyDisplay: "code",
            }).format(data?.saldoTotal.USD || 0)}
          </p>
          <div className="flex gap-1 justify-center items-center">
            <p className="text-sm text-muted-foreground">Saldo total</p>
          </div>
        </div>
        <div className="flex justify-between items-center gap-2 text-sm">
          <p className="font-semibold">Inventarios</p>
          <p className="text-xs">
            {Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "CUP",
              currencyDisplay: "code",
            }).format(data?.saldoInventarios || 0)}
          </p>
        </div>
        <Separator />
        <div className="flex justify-between items-start gap-2 text-sm">
          <p className="font-semibold">Efectivo</p>
          <div className="space-y-1 text-right">
            <p className="text-xs">
              {Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "CUP",
                currencyDisplay: "code",
              }).format(data?.saldoCuentasEfectivoCUP || 0)}
            </p>
            <p className="text-xs">
              {Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "USD",
                currencyDisplay: "code",
              }).format(data?.saldoCuentasEfectivoUSD || 0)}
            </p>
          </div>
        </div>
        <Separator />
        <div className="flex justify-between items-center gap-2 text-sm">
          <p className="font-semibold">Bancarias</p>
          <p className="text-xs">
            {Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "CUP",
              currencyDisplay: "code",
            }).format(data?.saldoCuentasBancarias || 0)}
          </p>
        </div>
        <Separator />
        <div className="flex justify-between items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Zelle />
            <p className="font-semibold">Zelle</p>
          </div>
          <p className="text-xs">
            {Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "CUP",
              currencyDisplay: "code",
            }).format(data?.saldoZelle || 0)}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
