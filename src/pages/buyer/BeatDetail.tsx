
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
      <div className="min-h-screen bg-black">
        <div className="p-4 space-y-6">
          <Skeleton className="h-[200px] w-full rounded-md bg-gray-800" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[150px] w-full rounded-md bg-gray-800" />
            <Skeleton className="h-[150px] w-full rounded-md bg-gray-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-[300px] w-full rounded-md bg-gray-800" />
            <Skeleton className="h-[300px] w-full rounded-md bg-gray-800" />
            <Skeleton className="h-[300px] w-full rounded-md bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-red-400">
          Error: Could not load beat details.
        </div>
      </div>
    );
  }

  if (!beat) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-gray-400">
          Beat not found.
        </div>
      </div>
    );
  }

  return <BeatDetailLayout beat={beat} />;
};

export default BeatDetail;
