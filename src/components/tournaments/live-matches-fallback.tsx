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
          <Skeleton className="mx-auto mt-2 h-7 w-16" />
        </div>
      ))}
    </>
  );
}

export function LiveMatchesEmpty() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <RadioIcon className="size-8 text-slate-300" />
      <p className="mt-2 text-sm font-medium text-slate-500">No live matches</p>
      <p className="text-xs text-slate-400">Live matches will appear here as they start.</p>
    </div>
  );
}
