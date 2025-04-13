import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { BeatTable } from "@/components/producer/BeatTable";
import { toast } from "sonner";
import { useBeats } from "@/hooks/useBeats";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [isRefreshingBeats, setIsRefreshingBeats] = useState(false);
  const { beats, getProducerBeats, isLoading, refetchBeats } = useBeats();

  useEffect(() => {
    document.title = "Producer Dashboard | OrderSOUNDS";
    if (!user) {
      router.push('/sign-in');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const producerBeats = getProducerBeats(user.id);

  const handleCreateBeat = () => {
    router.push('/producer/create');
  };
  
  const handleRefreshBeats = async () => {
    if (!user) return;
    setIsRefreshingBeats(true);
    await refetchBeats();
    toast.success('Beats data refreshed');
    setIsRefreshingBeats(false);
  };

  return (
    <MainLayout>
      <div className="container py-4 md:py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0 mb-4">
          <h1 className="text-2xl font-bold">Your Beats</h1>
          <div className="space-x-2">
            <Button onClick={handleCreateBeat}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Beat
            </Button>
            <Button 
              variant="outline" 
              disabled={isRefreshingBeats || isLoading}
              onClick={handleRefreshBeats}
            >
              {isRefreshingBeats ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Beats
                </>
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-2 border-b border-border">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <BeatTable beats={producerBeats} />
        )}
      </div>
    </MainLayout>
  );
}
