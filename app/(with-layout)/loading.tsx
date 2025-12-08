import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full h-full min-h-screen">
      <div className="flex justify-between items-center">
        <Skeleton className="" />
        <Skeleton />
      </div>
    </div>
  );
}
