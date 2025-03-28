
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function PurchasedBeatsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Purchased Beats</h2>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
