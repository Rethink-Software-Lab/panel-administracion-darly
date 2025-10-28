import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">
            <Skeleton className="w-48 h-4" />
          </h3>
          <div className="bg-muted/70 rounded-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 w-[100px]">Número</TableHead>
                  <TableHead className="text-right pr-4">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium pl-4 w-full">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium pl-4 w-full">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">
            <Skeleton className="w-48 h-4" />
          </h3>
          <div className="bg-muted/70 rounded-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 w-[100px]">Número</TableHead>
                  <TableHead className="text-right pr-4">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium pl-4 w-full">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium pl-4 w-full">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">
            <Skeleton className="w-48 h-4" />
          </h3>
          <div className="bg-muted/70 rounded-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 w-[100px]">Número</TableHead>
                  <TableHead className="text-right pr-4">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium pl-4 w-full">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium pl-4 w-full">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">
            <Skeleton className="w-48 h-4" />
          </h3>
          <div className="bg-muted/70 rounded-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 w-[100px]">Número</TableHead>
                  <TableHead className="text-right pr-4">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium pl-4 w-full">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium pl-4 w-full">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Skeleton className="w-16 h-4" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>
  );
}
