import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Kanban skeleton */}
      <div className="flex gap-3 overflow-x-auto pb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((col) => (
          <div key={col} className="flex flex-col min-w-[220px] rounded-2xl">
            <div className="px-4 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>

            <div className="flex-1 px-2 pb-6">
              <div className="flex flex-col gap-3 min-h-[200px] p-2">
                {[1, 2].map((card) => (
                  <Card key={card} className="p-4">
                    <CardHeader className="p-0 pb-2">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-3/4" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2 space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-7 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
