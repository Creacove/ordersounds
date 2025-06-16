import React, { memo } from 'react';
import { BeatCard } from '@/components/ui/BeatCard';
import { Beat } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, MusicIcon, UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInView } from '@/hooks/useIntersectionObserver';

interface SearchResultsProps {
  beats: Beat[];
  producers: any[];
  activeTab: string;
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  showNoResults?: boolean;
  searchTerm?: string;
}

const BeatItem = memo(({ beat }: { beat: Beat }) => (
  <BeatCard key={beat.id} beat={beat} />
));

const ProducerItem = memo(({ producer }: { producer: any }) => (
  <Link 
    key={producer.id}
    to={`/producer/${producer.id}`}
    className="bg-card rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
  >
    <div className="w-20 h-20 rounded-full bg-muted overflow-hidden mb-3">
      <img 
        src={producer.profile_picture || '/placeholder.svg'} 
        alt={producer.stage_name || producer.full_name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
    <h3 className="font-medium text-sm">{producer.stage_name || producer.full_name}</h3>
    <p className="text-xs text-muted-foreground mb-1">Producer</p>
    {producer.follower_count > 0 && (
      <p className="text-xs text-muted-foreground">{producer.follower_count} followers</p>
    )}
  </Link>
));

function LoadingGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div 
          key={i} 
          className="bg-card rounded-lg aspect-square animate-pulse"
          style={{ animationDelay: `${i * 0.05}s` }}
        />
      ))}
    </div>
  );
}

function InfiniteLoadTrigger({ onLoadMore, hasNextPage, isFetchingNextPage }: {
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && onLoadMore) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  if (!hasNextPage) return null;

  return (
    <div ref={ref} className="flex justify-center py-4">
      {isFetchingNextPage && (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}

export const SearchResults = memo(({
  beats,
  producers,
  activeTab,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  showNoResults,
  searchTerm
}: SearchResultsProps) => {
  if (isLoading) {
    return <LoadingGrid />;
  }

  if (showNoResults) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <MusicIcon size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        <p className="text-muted-foreground mb-6">
          We couldn't find anything matching "{searchTerm}". Try different keywords.
        </p>
      </div>
    );
  }

  const showBeats = activeTab === 'all' || activeTab === 'beats';
  const showProducers = activeTab === 'all' || activeTab === 'producers';

  return (
    <div className="space-y-8">
      {/* Beats Results */}
      {showBeats && beats.length > 0 && (
        <div>
          {activeTab === 'all' && <h3 className="text-lg font-semibold mb-4">Beats</h3>}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {beats.map((beat) => (
              <BeatItem key={beat.id} beat={beat} />
            ))}
          </div>
          
          {/* Infinite scroll trigger for beats */}
          {activeTab !== 'producers' && (
            <InfiniteLoadTrigger 
              onLoadMore={onLoadMore}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          )}
        </div>
      )}

      {/* Producers Results */}
      {showProducers && producers.length > 0 && (
        <div>
          {activeTab === 'all' && <h3 className="text-lg font-semibold mb-4">Producers</h3>}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {producers.map((producer) => (
              <ProducerItem key={producer.id} producer={producer} />
            ))}
          </div>
        </div>
      )}

      {/* No results for specific tabs */}
      {activeTab === 'beats' && beats.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <MusicIcon size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No beats found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}

      {activeTab === 'producers' && producers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <UserIcon size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No producers found</h3>
          <p className="text-muted-foreground">Try adjusting your search terms.</p>
        </div>
      )}
    </div>
  );
});

SearchResults.displayName = 'SearchResults';
