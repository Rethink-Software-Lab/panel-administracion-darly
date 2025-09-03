"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import type { DateRange } from "react-day-picker";
import { useMemo } from "react";

export function DateRangePickerServer() {
  const [range, setRange] = useQueryStates(
    { from: parseAsIsoDateTime, to: parseAsIsoDateTime },
    {
      shallow: false,
      clearOnDefault: true,
    }
  );

  const handleDateSelect = (selectedRange: DateRange | undefined) => {
    const fromDate = selectedRange?.from;
    let toDate = selectedRange?.to;

    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      toDate = endOfDay;
    }

    setRange({
      from: fromDate ?? null,
      to: toDate ?? null,
    });
  };

  const selectedCalendarDate: DateRange | undefined = useMemo(() => {
    return {
      from: range.from ?? undefined,
      to: range.to ?? undefined,
    };
  }, [range]);

  return (
    <div className="flex flex-col sm:space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal max-sm:w-full",
              !range.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {range.from && format(range.from, "dd MMM yyyy", { locale: es })}
            {range.from && range.to && " - "}
            {range.to && format(range.to, "dd MMM yyyy", { locale: es })}
            {!range.from && !range.to && <span>Selecciona un rango</span>}
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
              selected={selectedCalendarDate}
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
