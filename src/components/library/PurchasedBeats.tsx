
import React from 'react';
import { usePurchasedBeatsOptimized } from '@/hooks/library/usePurchasedBeatsOptimized';
import { EmptyState } from './EmptyState';
import { PurchasedBeatsLoading } from './PurchasedBeatsLoading';
import { Button } from '@/components/ui/button';
import { RefreshCw, Music } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
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
    handleDownload,
    error
  } = usePurchasedBeatsOptimized();
  const isMobile = useIsMobile();

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
          <h2 className="text-xl font-bold">Your Purchased Beats</h2>
          <Button variant="outline" size={isMobile ? "sm" : "default"} disabled>
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Refresh</span>
          </Button>
        </div>
        <PurchasedBeatsLoading />
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
          <h2 className="text-xl font-bold">Your Purchased Beats</h2>
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            onClick={refreshPurchasedBeats}
            className="w-full xs:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Retry</span>
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to load purchased beats. Please try again.</p>
        </div>
      </div>
    );
  }

  // Show empty state if no purchased beats
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
