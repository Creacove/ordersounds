import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ShoppingCart } from "lucide-react";
import { Beat } from "@/types";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { LicenseSelector } from "@/components/marketplace/LicenseSelector";
import { ToggleFavoriteButton } from "@/components/buttons/ToggleFavoriteButton";

interface BeatCardProps {
  beat: Beat;
  isInCart?: boolean;
  onAddToCart?: () => void;
  showLicenseSelector?: boolean;
  featured?: boolean;
}

export function BeatCard({ 
  beat, 
  isInCart, 
  onAddToCart, 
  showLicenseSelector = true,
  featured = false
}: BeatCardProps) {
  const { currency } = useAuth();
  const { toggleCartItem } = useCart();
  const [selectedLicense, setSelectedLicense] = useState<'basic' | 'premium' | 'exclusive' | 'custom'>('basic');
  
  const handleAddToCart = () => {
    toggleCartItem(beat, selectedLicense);
  };

  const getPriceForLicense = () => {
    if (currency === 'NGN') {
      switch (selectedLicense) {
        case 'basic':
          return beat.basic_license_price_local;
        case 'premium':
          return beat.premium_license_price_local;
        case 'exclusive':
          return beat.exclusive_license_price_local;
        case 'custom':
          return beat.custom_license_price_local;
        default:
          return beat.basic_license_price_local;
      }
    } else {
      switch (selectedLicense) {
        case 'basic':
          return beat.basic_license_price_diaspora;
        case 'premium':
          return beat.premium_license_price_diaspora;
        case 'exclusive':
          return beat.exclusive_license_price_diaspora;
         case 'custom':
          return beat.custom_license_price_diaspora;
        default:
          return beat.basic_license_price_diaspora;
      }
    }
  };
  
  const price = getPriceForLicense();

  // The component layout:
  return (
    <Card className={`group overflow-hidden h-full ${featured ? 'border-primary bg-primary/5' : ''}`}>
      <CardContent className="p-0 flex flex-col h-full">
        <div className="relative">
          <ToggleFavoriteButton beatId={beat.id} />
          <Link to={`/beat/${beat.id}`}>
            <img
              src={beat.cover_image_url || "/placeholder.svg"}
              alt={beat.title}
              className="aspect-square w-full object-cover rounded-none group-hover:scale-105 transition-transform duration-200"
            />
          </Link>
          
          {featured && (
            <div className="absolute top-0 right-0 bg-primary text-white text-xs px-2 py-1 m-2 rounded-full">
              Featured
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 text-white flex items-end justify-between">
            <div>
              <h3 className="font-semibold">{beat.title}</h3>
              <p className="text-sm opacity-70">by {beat.producer_name}</p>
            </div>
            <Button variant="link" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 flex flex-col justify-between flex-1">
          {showLicenseSelector && (
            <LicenseSelector onChange={setSelectedLicense} />
          )}
          
          <CardFooter className="flex items-center justify-between p-0 mt-4">
            <div>
              <Label className="text-sm opacity-70">Price</Label>
              <p className="font-semibold text-lg">
                {formatCurrency(price || 0, currency)}
              </p>
            </div>
            <Button 
              onClick={handleAddToCart}
              disabled={isInCart}
            >
              {isInCart ? (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  <span>In Cart</span>
                </>
              ) : (
                <>
                  Add to Cart
                </>
              )}
            </Button>
          </CardFooter>
        </div>
      </CardContent>
    </Card>
  );
}
