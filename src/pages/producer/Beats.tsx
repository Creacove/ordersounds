
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BeatCard } from "@/components/ui/BeatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Music, LayoutGrid, LayoutList, Table as LucideTable } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type ViewMode = "grid" | "list" | "table";

export default function ProducerBeats() {
  const { user } = useAuth();
  const { beats, isLoading, isPurchased, isFavorite, fetchBeats } = useBeats();
  const { isInCart } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? "list" : "grid");
  const [tabValue, setTabValue] = useState<"published" | "drafts">("published");

  useEffect(() => {
    document.title = "My Beats | OrderSOUNDS";
  }, []);

  useEffect(() => {
    fetchBeats();
  }, [fetchBeats]);

  useEffect(() => {
    if (isMobile && viewMode === "table") {
      setViewMode("list");
    }
  }, [isMobile, viewMode]);

  const producerId = user ? user.id : 'anonymous-producer';
  const producerBeats = beats.filter(beat => beat.producer_id === producerId);
  const draftBeats = producerBeats.filter(beat => beat.status === 'draft');
  const publishedBeats = producerBeats.filter(beat => beat.status === 'published');

  // Helper for no beats state
  const NoBeatsCard = ({
    title,
    description,
    showUpload = true,
  }: {
    title: string,
    description: string,
    showUpload?: boolean
  }) => (
    <Card className="border border-dashed bg-muted/30">
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        <div className="rounded-full bg-primary/10 p-3 mb-4">
          <Music className="h-6 w-6 text-primary" />
        </div>
        <h2 className="heading-responsive-sm mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-5">
          {description}
        </p>
        {showUpload && (
          <Button 
            onClick={() => navigate('/producer/upload')}
            className="gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            Upload Beat
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <MainLayout activeTab="beats">
      <div
        className={cn(
          "container py-6 md:py-8 max-w-full px-2 md:px-4 lg:px-8",
          isMobile ? "pb-20" : ""
        )}
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="heading-responsive-lg">My Beats</h1>
            <span className="text-muted-foreground text-sm">
              {producerBeats.length} {producerBeats.length === 1 ? "beat" : "beats"}
            </span>
          </div>
          <Button
            onClick={() => navigate("/producer/upload")}
            size="sm"
            className="gap-1.5 flex-shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            Upload
          </Button>
        </div>

        <div className="mb-3 flex flex-col items-stretch md:flex-row md:items-end md:justify-between gap-2">
          <Tabs
            value={tabValue}
            onValueChange={v => setTabValue(v as "published" | "drafts")}
            className="w-full"
          >
            <TabsList className="flex w-full max-w-xs md:max-w-sm mx-auto md:mx-0 mb-2 md:mb-0">
              <TabsTrigger
                value="published"
                className={cn(
                  "flex-1",
                  tabValue === "published" ? "shadow" : ""
                )}
              >
                Published ({publishedBeats.length})
              </TabsTrigger>
              <TabsTrigger
                value="drafts"
                className={cn(
                  "flex-1",
                  tabValue === "drafts" ? "shadow" : ""
                )}
              >
                Drafts ({draftBeats.length})
              </TabsTrigger>
            </TabsList>
            <div className="hidden md:flex gap-2 ml-2">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs py-1 px-2.5 h-auto"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs py-1 px-2.5 h-auto"
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <LayoutList className="h-4 w-4 mr-1.5" />
                List
              </Button>
              {!isMobile && (
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs py-1 px-2.5 h-auto"
                  onClick={() => setViewMode("table")}
                  aria-label="Table view"
                >
                  <LucideTable className="h-4 w-4 mr-1.5" />
                  Table
                </Button>
              )}
            </div>
            <TabsContent
              value="published"
              className="mt-4 min-h-[200px] animate-fade-in"
            >
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="aspect-square w-full rounded-lg" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : publishedBeats.length > 0 ? (
                <>
                  {viewMode === "grid" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
                      {publishedBeats.map((beat) => (
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
                  {viewMode === "list" && (
                    <div className="space-y-3">
                      {publishedBeats.map((beat) => (
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
                  {viewMode === "table" && !isMobile && (
                    <div className="rounded-md border overflow-x-auto">
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
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {publishedBeats.map((beat) => (
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
                              <TableCell>
                                <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-900 text-xs font-semibold">
                                  PUBLISHED
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </UITable>
                    </div>
                  )}
                </>
              ) : (
                <NoBeatsCard
                  title="No Published Beats"
                  description="You haven't published any beats yet. Upload or publish a beat to get started!"
                />
              )}
            </TabsContent>
            <TabsContent
              value="drafts"
              className="mt-4 min-h-[200px] animate-fade-in"
            >
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="aspect-square w-full rounded-lg" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : draftBeats.length > 0 ? (
                <>
                  {viewMode === "grid" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
                      {draftBeats.map((beat) => (
                        <BeatCard
                          key={beat.id}
                          beat={beat}
                          isFavorite={isFavorite(beat.id)}
                          isInCart={isInCart(beat.id)}
                          isPurchased={isPurchased(beat.id)}
                          className="h-full shadow-sm hover:shadow ring-2 ring-yellow-300"
                          label="DRAFT"
                        />
                      ))}
                    </div>
                  )}
                  {viewMode === "list" && (
                    <div className="space-y-3">
                      {draftBeats.map((beat) => (
                        <BeatListItem
                          key={beat.id}
                          beat={beat}
                          isFavorite={isFavorite(beat.id)}
                          isInCart={isInCart(beat.id)}
                          isPurchased={isPurchased(beat.id)}
                          statusLabel="DRAFT"
                        />
                      ))}
                    </div>
                  )}
                  {viewMode === "table" && !isMobile && (
                    <div className="rounded-md border overflow-x-auto">
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
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {draftBeats.map((beat) => (
                            <TableRow
                              key={beat.id}
                              className="cursor-pointer hover:bg-yellow-50"
                              onClick={() => navigate(`/beat/${beat.id}`)}
                            >
                              <TableCell className="p-2">
                                <div className="relative h-10 w-10 rounded-md overflow-hidden ring-2 ring-yellow-300">
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
                              <TableCell>
                                <span className="inline-block px-2 py-0.5 rounded bg-yellow-200 text-yellow-900 text-xs font-semibold">
                                  DRAFT
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </UITable>
                    </div>
                  )}
                </>
              ) : (
                <NoBeatsCard
                  title="No Drafts"
                  description="You don't have any draft beats! Upload or save a beat as draft to see them here."
                  showUpload={true}
                />
              )}
            </TabsContent>
          </Tabs>
          {/* View mode buttons for mobile */}
          <div className="flex md:hidden gap-2 mb-2">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs py-1 px-2.5 h-auto"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs py-1 px-2.5 h-auto"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4 mr-1.5" />
              List
            </Button>
            {/* Table option hidden on mobile */}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

