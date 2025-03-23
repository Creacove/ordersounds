
import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useBeats } from "@/hooks/useBeats";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Music, Heart, ShoppingCart } from "lucide-react";

export default function Charts() {
  const { beats, isLoading, toggleFavorite, isFavorite } = useBeats();
  
  useEffect(() => {
    document.title = "Charts | Creacove";
  }, []);

  // Sort beats by popularity (favorites + purchases)
  const chartBeats = [...beats]
    .sort((a, b) => 
      (b.favorites_count + b.purchase_count) - (a.favorites_count + a.purchase_count)
    )
    .slice(0, 20); // Top 20

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Top Charts</h1>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Producer</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead className="text-center">Favorites</TableHead>
                  <TableHead className="text-center">Purchases</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartBeats.map((beat, index) => (
                  <TableRow key={beat.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded overflow-hidden">
                          <img 
                            src={beat.cover_image_url || "https://placehold.co/40x40"} 
                            alt={beat.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium">{beat.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{beat.producer_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{beat.genre}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{beat.favorites_count}</TableCell>
                    <TableCell className="text-center">{beat.purchase_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => toggleFavorite(beat.id)}
                          className={`p-1.5 rounded-full ${
                            isFavorite(beat.id) 
                              ? "bg-red-500/10 text-red-500" 
                              : "bg-muted text-muted-foreground hover:text-primary"
                          }`}
                        >
                          <Heart size={16} />
                        </button>
                        <button className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-primary">
                          <Music size={16} />
                        </button>
                        <button className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-primary">
                          <ShoppingCart size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
