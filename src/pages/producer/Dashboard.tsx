import { useState, useEffect } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { BeatCard } from "@/components/marketplace/BeatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { Link, useNavigate } from "react-router-dom";
import {
  FilePlus2,
  ArrowRight,
  Search,
  Music,
  Upload,
  SlidersHorizontal,
  Heart,
  ShoppingCart,
  Loader2
} from "lucide-react";
import { Beat } from "@/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function Dashboard() {
  const { user } = useAuth();
  const { beats: allBeats, getProducerBeats, refetchBeats, isLoading, toggleFavorite } = useBeats();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [showPublished, setShowPublished] = useState(true);
  const [showDrafts, setShowDrafts] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      const producerBeats = getProducerBeats();
      setBeats(producerBeats);
    }
  }, [user, allBeats]);

  useEffect(() => {
    const filteredBeats = getProducerBeats().filter(beat => {
      const matchesSearch = beat.title.toLowerCase().includes(searchQuery.toLowerCase());
      const isPublished = showPublished && beat.status === 'published';
      const isDraft = showDrafts && beat.status === 'draft';
      return matchesSearch && (isPublished || isDraft);
    });
    setBeats(filteredBeats);
  }, [searchQuery, showPublished, showDrafts, allBeats, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchQuery(searchQuery.trim());
    }
  };

  const handleToggleFavorite = async (beatId: string) => {
    try {
      await toggleFavorite(beatId);
      // Optimistically update the UI
      setBeats(prevBeats => {
        return prevBeats.map(beat => {
          if (beat.id === beatId) {
            return {
              ...beat,
              favorites_count: (beat.favorites_count || 0) + (allBeats.find(b => b.id === beatId)?.favorites_count || 0)
            };
          }
          return beat;
        });
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Uh oh! Something went wrong.",
        description: "There was a problem toggling the favorite status.",
        variant: "destructive",
      })
    }
  };

  const handleRefetch = async () => {
    setIsRefetching(true);
    try {
      refetchBeats(); // Remove any arguments that were being passed
      toast({
        title: "Success!",
        description: "Beats have been refetched.",
      })
    } catch (error) {
      console.error("Error refetching beats:", error);
      toast({
        title: "Uh oh! Something went wrong.",
        description: "There was a problem refetching the beats.",
        variant: "destructive",
      })
    } finally {
      setIsRefetching(false);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold">Please log in to view your dashboard</h1>
          <p className="text-muted-foreground">You must be logged in to access this page.</p>
          <Button asChild>
            <Link to="/login">Log In</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-10">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Producer Dashboard</h1>
          <Button asChild>
            <Link to="/producer/upload">
              <FilePlus2 className="mr-2 h-4 w-4" />
              Upload New Beat
            </Link>
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter and Search</CardTitle>
            <CardDescription>Customize your beat listings.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="col-span-1">
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center">
                  <Input
                    type="text"
                    placeholder="Search beats..."
                    className="pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" className="absolute right-1 top-1 rounded-md">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="published">Published</Label>
              <Switch
                id="published"
                checked={showPublished}
                onCheckedChange={(checked) => setShowPublished(checked)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="drafts">Drafts</Label>
              <Switch
                id="drafts"
                checked={showDrafts}
                onCheckedChange={(checked) => setShowDrafts(checked)}
              />
            </div>

            <Button
              variant="outline"
              onClick={handleRefetch}
              disabled={isRefetching || isLoading}
              className="w-full mt-4"
            >
              {isRefetching || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Apply Filters
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-40 w-full rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : beats.length > 0 ? (
            beats.map((beat) => (
              <BeatCard
                key={beat.id}
                beat={beat}
                onToggleFavorite={handleToggleFavorite}
                isDashboardView={true}
              />
            ))
          ) : (
            <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 text-center py-10">
              <h2 className="text-xl font-semibold">No beats found</h2>
              <p className="text-muted-foreground">
                Upload your first beat or adjust your search filters.
              </p>
              <Button asChild className="mt-4">
                <Link to="/producer/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Beat
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
