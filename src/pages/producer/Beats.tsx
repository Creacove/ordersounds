
import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BeatCard } from "@/components/ui/BeatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ProducerBeats() {
  const { user } = useAuth();
  const { beats, isLoading } = useBeats();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    document.title = "My Beats | OrderSOUNDS";
    
    // Redirect to login if not authenticated or not a producer
    if (!user) {
      navigate('/login', { state: { from: '/producer/beats' } });
    } else if (user.role !== 'producer') {
      navigate('/');
    }
  }, [user, navigate]);

  // Filter beats by producer
  const producerBeats = user ? beats.filter(beat => beat.producer_id === user.id) : [];

  // If not logged in or not a producer, show login prompt
  if (!user || user.role !== 'producer') {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="text-center">
            <h1 className="heading-responsive-md mb-4">Producer Access Required</h1>
            <p className="text-responsive-base mb-4">You need to be logged in as a producer to access this page.</p>
            <Button onClick={() => navigate('/login')}>Login</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={cn(
        "container py-6 md:py-8",
        isMobile ? "mobile-content-padding" : ""
      )}>
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h1 className="heading-responsive-lg">My Beats</h1>
          <Button 
            onClick={() => navigate('/producer/upload')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Upload Beat
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : producerBeats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {producerBeats.map((beat) => (
              <BeatCard key={beat.id} beat={beat} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 md:py-16 bg-muted rounded-lg">
            <h2 className="heading-responsive-sm mb-4">No Beats Yet</h2>
            <p className="text-responsive-base text-muted-foreground mb-6">
              You haven't uploaded any beats yet. Get started by uploading your first beat!
            </p>
            <Button 
              onClick={() => navigate('/producer/upload')}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Upload Beat
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
