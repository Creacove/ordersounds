import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BeatCard } from "@/components/ui/BeatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Music, Grid, List, Table } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { BeatListItem } from "@/components/ui/BeatListItem";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCart } from "@/context/CartContext";

type ViewMode = "grid" | "list" | "table";

export default function ProducerBeats() {
  const { user, isProducerInactive } = useAuth();
  const { beats, isLoading, isPurchased, isFavorite } = useBeats();
  const { isInCart } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? "list" : "grid");
  
  useEffect(() => {
    document.title = "My Beats | OrderSOUNDS";
    
    // Redirect to login if not authenticated 
    if (!user) {
      navigate('/login', { state: { from: '/producer/beats' } });
    } 
    // Redirect to home if not a producer
    else if (user.role !== 'producer') {
      navigate('/');
    }
    // Redirect inactive producers to activation page
    else if (isProducerInactive) {
      navigate('/producer-activation');
    }
  }, [user, navigate, isProducerInactive]);

  // Update view mode when screen size changes
  useEffect(() => {
    if (isMobile && viewMode === "table") {
      setViewMode("list");
    }
  }, [isMobile, viewMode]);

  // Filter beats by producer
  const producerBeats = user ? beats.filter(beat => beat.producer_id === user.id) : [];

  // If not logged in or not a producer or inactive producer, show loading while redirect happens
  if (!user || user.role !== 'producer' || isProducerInactive) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout activeTab="beats">
      <div className={cn(
        "container py-6 md:py-8 max-w-full px-4 md:px-8 lg:px-12",
        isMobile ? "pb-20" : ""
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
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="text-xs py-1 px-2.5 h-auto"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-3.5 w-3.5 mr-1.5" />
            Grid
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className="text-xs py-1 px-2.5 h-auto"
            onClick={() => setViewMode("list")}
          >
            <List className="h-3.5 w-3.5 mr-1.5" />
            List
          </Button>
          {!isMobile && (
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs py-1 px-2.5 h-auto"
              onClick={() => setViewMode("table")}
            >
              <Table className="h-3.5 w-3.5 mr-1.5" />
              Table
            </Button>
          )}
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
            {/* Grid View - Desktop */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {producerBeats.map((beat) => (
                  <BeatCard 
                    key={beat.id} 
                    beat={beat}
                    isFavorite={isFavorite(beat.id)}
                    isInCart={isInCart(beat.id)}
                    isPurchased={isPurchased(beat.id)}
                    className="h-full shadow-sm hover:shadow"
                  />
                ))}
              </div>
            )}
            
            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-3">
                {producerBeats.map((beat) => (
                  <BeatListItem
                    key={beat.id}
                    beat={beat}
                    isFavorite={isFavorite(beat.id)}
                    isInCart={isInCart(beat.id)}
                    isPurchased={isPurchased(beat.id)}
                  />
                ))}
              </div>
            )}
            
            {/* Table View - Desktop only */}
            {viewMode === "table" && !isMobile && (
              <div className="rounded-md border">
                <UITable>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>BPM</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Track Type</TableHead>
                      <TableHead className="text-right">Price (Local)</TableHead>
                      <TableHead className="text-right">Price (Diaspora)</TableHead>
                      <TableHead className="text-right">Plays</TableHead>
                      <TableHead className="text-right">Favorites</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {producerBeats.map((beat) => (
                      <TableRow 
                        key={beat.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/beat/${beat.id}`)}
                      >
                        <TableCell className="p-2">
                          <div className="relative h-10 w-10 rounded-md overflow-hidden">
                            <img 
                              src={beat.cover_image_url || '/placeholder.svg'} 
                              alt={beat.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{beat.title}</TableCell>
                        <TableCell>{beat.genre}</TableCell>
                        <TableCell>{beat.bpm} BPM</TableCell>
                        <TableCell>{beat.key || "-"}</TableCell>
                        <TableCell>{beat.track_type}</TableCell>
                        <TableCell className="text-right">₦{(beat.basic_license_price_local || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">${(beat.basic_license_price_diaspora || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{beat.plays || 0}</TableCell>
                        <TableCell className="text-right">{beat.favorites_count}</TableCell>
                        <TableCell className="text-right">{beat.purchase_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </UITable>
              </div>
            )}
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
