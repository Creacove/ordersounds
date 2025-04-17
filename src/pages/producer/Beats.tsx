
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BeatCard } from "@/components/ui/BeatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Music, Grid, List, Table, Filter } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMode = "grid" | "list" | "table";
type StatusFilter = "all" | "published" | "draft";

export default function ProducerBeats() {
  const { user } = useAuth();
  const { beats, isLoading, isPurchased, isFavorite } = useBeats();
  const { isInCart } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? "list" : "grid");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  
  useEffect(() => {
    document.title = "My Beats | OrderSOUNDS";
    
    // Redirect to login if not authenticated or not a producer
    if (!user) {
      navigate('/login', { state: { from: '/producer/beats' } });
    } else if (user.role !== 'producer') {
      navigate('/');
    }
  }, [user, navigate]);

  // Update view mode when screen size changes
  useEffect(() => {
    if (isMobile && viewMode === "table") {
      setViewMode("list");
    }
  }, [isMobile, viewMode]);

  // Filter beats by producer and status
  const producerBeats = user ? beats.filter(beat => beat.producer_id === user.id) : [];
  
  const filteredBeats = producerBeats.filter(beat => {
    if (statusFilter === "all") return true;
    return beat.status === statusFilter;
  });

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

  const publishedCount = producerBeats.filter(beat => beat.status === "published").length;
  const draftCount = producerBeats.filter(beat => beat.status === "draft").length;

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
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(value: StatusFilter) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Beats</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 ml-2">
              <Badge variant="outline" className="bg-primary/10">
                Published: {publishedCount}
              </Badge>
              <Badge variant="outline" className="bg-muted">
                Drafts: {draftCount}
              </Badge>
            </div>
          </div>
          
          {/* View switcher */}
          <div className="flex items-center justify-end gap-2">
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
        ) : filteredBeats.length > 0 ? (
          <>
            {/* Grid View - Desktop */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {filteredBeats.map((beat) => (
                  <BeatCard 
                    key={beat.id} 
                    beat={beat}
                    isFavorite={isFavorite(beat.id)}
                    isInCart={isInCart(beat.id)}
                    isPurchased={isPurchased(beat.id)}
                    className="h-full shadow-sm hover:shadow"
                    showStatus
                  />
                ))}
              </div>
            )}
            
            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-3">
                {filteredBeats.map((beat) => (
                  <BeatListItem
                    key={beat.id}
                    beat={beat}
                    isFavorite={isFavorite(beat.id)}
                    isInCart={isInCart(beat.id)}
                    isPurchased={isPurchased(beat.id)}
                    showStatus
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
                      <TableHead>Status</TableHead>
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
                    {filteredBeats.map((beat) => (
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
                        <TableCell>
                          <Badge variant={beat.status === "published" ? "default" : "outline"} className={beat.status === "draft" ? "bg-muted text-muted-foreground" : ""}>
                            {beat.status === "published" ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
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
              <h2 className="heading-responsive-sm mb-2">
                {statusFilter === "all" 
                  ? "No Beats Yet" 
                  : statusFilter === "published" 
                    ? "No Published Beats" 
                    : "No Draft Beats"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mb-5">
                {statusFilter === "all" 
                  ? "You haven't uploaded any beats yet. Get started by uploading your first beat!" 
                  : statusFilter === "published" 
                    ? "You don't have any published beats yet. Publish your drafted beats or upload new ones." 
                    : "You don't have any draft beats. Your beats are either published or you haven't uploaded any yet."}
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
