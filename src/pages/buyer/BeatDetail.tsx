import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from "@/components/layout/MainLayout";
import { BeatCardDetailed } from "@/components/ui/BeatCardDetailed";
import { Skeleton } from "@/components/ui/skeleton";
import { useBeatQuery } from "@/hooks/useBeatsQuery";

const BeatDetail = () => {
  const { beatId } = useParams<{ beatId: string }>();

  useEffect(() => {
    document.title = "Beat Details | OrderSOUNDS";
  }, []);

  // Replace any incorrect useBeatQuery usage with correct single parameter
  const { data: beat, isLoading, error } = useBeatQuery(beatId || '');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-4 md:py-8 px-4 md:px-6">
          <Skeleton className="h-[300px] w-full rounded-md mb-4" />
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-6 w-1/4 mb-4" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-full mb-2" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container py-4 md:py-8 px-4 md:px-6">
          <div className="text-center text-red-500">
            Error: Could not load beat details.
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!beat) {
    return (
      <MainLayout>
        <div className="container py-4 md:py-8 px-4 md:px-6">
          <div className="text-center text-muted-foreground">
            Beat not found.
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-4 md:py-8 px-4 md:px-6">
        <BeatCardDetailed beat={beat} />
      </div>
    </MainLayout>
  );
};

export default BeatDetail;
