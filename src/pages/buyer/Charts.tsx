import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useBeats } from "@/hooks/useBeats";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Music, Heart, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { usePlayer } from "@/context/PlayerContext";
import { BeatListItem } from "@/components/ui/BeatListItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { PriceTag } from "@/components/ui/PriceTag";
import { getLicensePrice } from '@/utils/licenseUtils';

export default function Charts() {
  const { beats, isLoading, toggleFavorite, isFavorite, isPurchased } = useBeats();
  const { addToCart, isInCart } = useCart();
  const { playBeat } = usePlayer();
  const { currency } = useAuth();
  
  useEffect(() => {
    document.title = "Charts | OrderSOUNDS";
  }, []);

  // Sort beats by popularity (favorites + purchases)
  const chartBeats = [...beats]
    .sort((a, b) => 
      (b.favorites_count + b.purchase_count) - (a.favorites_count + a.purchase_count)
    )
    .slice(0, 20); // Top 20

  const handleAddToCart = (beat) => {
    if (!isInCart(beat.id)) {
      addToCart(beat);
      toast.success(`Added "${beat.title}" to cart`);
    } else {
      toast.info("This beat is already in your cart");
    }
  };

  const handlePlayBeat = (beat) => {
    playBeat(beat);
  };
  
  // Helper to get price based on currency
  const getBasicLicensePrice = (beat) => {
    return currency === 'USD'
      ? beat.basic_license_price_diaspora || 0
      : beat.basic_license_price_local || 0;
  };

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
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
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
                          <div className="w-10 h-10 rounded overflow-hidden cursor-pointer" onClick={() => handlePlayBeat(beat)}>
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
                            className={cn(
                              "p-1.5 rounded-full",
                              isFavorite(beat.id)
                                ? "bg-purple-500/10 text-purple-500" 
                                : "bg-muted text-muted-foreground hover:text-primary"
                            )}
                          >
                            <Heart size={16} fill={isFavorite(beat.id) ? "currentColor" : "none"} />
                          </button>
                          <button 
                            className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-primary"
                            onClick={() => handlePlayBeat(beat)}
                          >
                            <Music size={16} />
                          </button>
                          <button 
                            className={cn(
                              "p-1.5 rounded-full",
                              isInCart(beat.id)
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground hover:text-primary"
                            )}
                            onClick={() => handleAddToCart(beat)}
                          >
                            <ShoppingCart size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top 20 Beats</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {chartBeats.map((beat, index) => (
                    <div key={beat.id} className="border-b last:border-0 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-sm bg-muted w-6 h-6 rounded-full flex items-center justify-center">{index + 1}</span>
                        <Badge variant="outline" className="ml-auto">{beat.genre}</Badge>
                      </div>
                      <BeatListItem 
                        beat={beat} 
                        isFavorite={isFavorite(beat.id)}
                        isInCart={isInCart(beat.id)}
                        isPurchased={isPurchased(beat.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
