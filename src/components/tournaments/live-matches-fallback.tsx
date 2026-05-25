import { RadioIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export function LiveMatchesFallback() {
  return (
    <>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-red-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <div className="mt-3 grid grid-cols-3 items-center justify-between">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="mx-auto h-3 w-6" />
            <Skeleton className="ml-auto h-7 w-20" />
          </div>
          <Skeleton className="mx-auto mt-2 h-15 w-16" />
        </div>
      ))}
    </>
  );
}

export function LiveMatchesEmpty() {
  return (
    <div className="col-span-full rounded-xl border border-dashed py-12 text-center">
      <RadioIcon className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-4 text-lg font-bold">No live matches</p>
      <p className="text-sm text-muted-foreground">Matches will appear here once they start</p>
    </div>
  );
}
