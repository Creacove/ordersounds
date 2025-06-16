
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { useBeatQuery } from "@/hooks/useBeatsQuery";
import { BeatDetailLayout } from "@/components/beat-detail/BeatDetailLayout";

const BeatDetail = () => {
  const { beatId } = useParams<{ beatId: string }>();

  useEffect(() => {
    document.title = "Beat Details | OrderSOUNDS";
  }, []);

  const { data: beat, isLoading, error } = useBeatQuery(beatId || '');

  if (isLoading) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-4 md:py-8 px-4 md:px-6">
          <Skeleton className="h-[300px] w-full rounded-md mb-4" />
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-6 w-1/4 mb-4" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-full mb-2" />
        </div>
      </MainLayoutWithPlayer>
    );
  }

  if (error) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-4 md:py-8 px-4 md:px-6">
          <div className="text-center text-red-500">
            Error: Could not load beat details.
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  if (!beat) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-4 md:py-8 px-4 md:px-6">
          <div className="text-center text-muted-foreground">
            Beat not found.
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  return (
    <MainLayoutWithPlayer>
      <BeatDetailLayout beat={beat} />
    </MainLayoutWithPlayer>
  );
};

export default BeatDetail;
