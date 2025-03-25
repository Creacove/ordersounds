
import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BeatCard } from "@/components/ui/BeatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { BeatListItem } from "@/components/ui/BeatListItem";

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
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="heading-responsive-lg">My Beats</h1>
            <span className="text-muted-foreground text-sm">
              {producerBeats.length} {producerBeats.length === 1 ? 'beat' : 'beats'}
            </span>
          </div>
          <Button 
            onClick={() => navigate('/producer/upload')}
            size="sm"
            className="gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            Upload
          </Button>
        </div>
        
        {/* View switcher */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs py-1 px-2.5 h-auto"
            onClick={() => {}}
          >
            Grid View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs py-1 px-2.5 h-auto bg-muted/50"
            onClick={() => {}}
          >
            List View
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : producerBeats.length > 0 ? (
          <>
            {/* More compact grid for desktop */}
            <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {producerBeats.map((beat) => (
                <BeatCard 
                  key={beat.id} 
                  beat={beat}
                  className="h-full shadow-sm hover:shadow"
                />
              ))}
            </div>
            
            {/* List view for mobile */}
            <div className="sm:hidden space-y-3">
              {producerBeats.map((beat) => (
                <BeatListItem
                  key={beat.id}
                  beat={beat}
                />
              ))}
            </div>
          </>
        ) : (
          <Card className="border border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <h2 className="heading-responsive-sm mb-2">No Beats Yet</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-5">
                You haven't uploaded any beats yet. Get started by uploading your first beat!
              </p>
              <Button 
                onClick={() => navigate('/producer/upload')}
                className="gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                Upload Beat
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
