"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Table } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Transacciones } from "@/app/(with-layout)/cuentas/types";
import { useEffect, useState } from "react";

interface DateRangePickerProps {
  table: Table<Transacciones>;
}

export function DateRangePickerFilter({ table }: DateRangePickerProps) {
  const globalDateRange = table.getColumn("createdAt")?.getFilterValue() as
    | DateRange
    | undefined;
  const [localDate, setLocalDate] = useState<DateRange | undefined>(
    globalDateRange
  );

  useEffect(() => {
    setLocalDate(globalDateRange);
  }, [globalDateRange]);

  const handleDateSelect = (selectedRange: DateRange | undefined) => {
    setLocalDate(selectedRange);

    if (selectedRange?.from && selectedRange?.to) {
      const fromDate = selectedRange.from;
      const endOfDay = new Date(selectedRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      const toDate = endOfDay;
      table
        .getColumn("createdAt")
        ?.setFilterValue({ from: fromDate, to: toDate });
    }
  };

  return (
    <div className="flex flex-col sm:space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal max-sm:w-full",
              !localDate?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {localDate?.from &&
              format(localDate.from, "dd MMM yyyy", { locale: es })}
            {localDate?.from && localDate?.to && " - "}
            {localDate?.to &&
              format(localDate.to, "dd MMM yyyy", { locale: es })}
            {!localDate?.from && !localDate?.to && (
              <span>Selecciona un rango</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="flex w-auto flex-col space-y-2 p-2"
        >
          <div className="rounded-md border">
            <Calendar
              mode="range"
              locale={es}
              weekStartsOn={1}
              selected={localDate}
              onSelect={handleDateSelect}
              disabled={(date) =>
                date > new Date() || date < new Date("2024-01-01")
              }
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
