
import React from 'react';
import { usePurchasedBeats } from '@/hooks/library/usePurchasedBeats';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { RefreshCw, Music } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { PurchasedBeatsLoading } from './PurchasedBeatsLoading';
import { PurchasedBeatsMobile } from './PurchasedBeatsMobile';
import { PurchasedBeatsDesktop } from './PurchasedBeatsDesktop';

export function PurchasedBeats() {
  const {
    purchasedBeats,
    isLoading,
    isRefreshing,
    beatsLoaded,
    purchaseDetails,
    refreshPurchasedBeats,
    handleDownload
  } = usePurchasedBeats();
  const isMobile = useIsMobile();

  // Show a loading skeleton while initial data is being loaded
  if (isLoading || !beatsLoaded) {
    return <PurchasedBeatsLoading />;
  }

  if (!purchasedBeats || purchasedBeats.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="No purchased beats yet"
        description="When you purchase beats, they will appear here for you to download."
        actionLabel="Browse Beats"
        actionHref="/"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold">Your Purchased Beats</h2>
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          onClick={refreshPurchasedBeats}
          disabled={isRefreshing}
          className="w-full xs:w-auto"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              <span className="whitespace-nowrap">Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">Refresh</span>
            </>
          )}
        </Button>
      </div>

      {isMobile ? (
        <PurchasedBeatsMobile 
          beats={purchasedBeats} 
          purchaseDetails={purchaseDetails} 
          onDownload={handleDownload} 
        />
      ) : (
        <PurchasedBeatsDesktop 
          beats={purchasedBeats} 
          purchaseDetails={purchaseDetails} 
          onDownload={handleDownload} 
        />
      )}
    </div>
  );
}
