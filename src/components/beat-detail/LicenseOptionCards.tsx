
import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Beat } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface LicenseOptionCardsProps {
  beat: Beat;
  currency: 'NGN' | 'USD';
  onLicenseSelect: (license: 'basic' | 'premium' | 'exclusive') => void;
  selectedLicense: 'basic' | 'premium' | 'exclusive';
}

export const LicenseOptionCards = ({ 
  beat, 
  currency, 
  onLicenseSelect, 
  selectedLicense 
}: LicenseOptionCardsProps) => {
  const { toggleCartItem, isInCart } = useCart();

  const getLicensePrice = (licenseType: 'basic' | 'premium' | 'exclusive') => {
    if (currency === 'NGN') {
      switch (licenseType) {
        case 'basic':
          return beat.basic_license_price_local || 0;
        case 'premium':
          return beat.premium_license_price_local || 0;
        case 'exclusive':
          return beat.exclusive_license_price_local || 0;
      }
    } else {
      switch (licenseType) {
        case 'basic':
          return beat.basic_license_price_diaspora || 0;
        case 'premium':
          return beat.premium_license_price_diaspora || 0;
        case 'exclusive':
          return beat.exclusive_license_price_diaspora || 0;
      }
    }
  };

  const getLicenseFeatures = (licenseType: 'basic' | 'premium' | 'exclusive') => {
    switch (licenseType) {
      case 'basic':
        return [
          "MP3 & WAV files",
          "Non-exclusive rights",
          "Up to 10,000 streams",
          "1 music video",
          "Basic distribution rights"
        ];
      case 'premium':
        return [
          "All Basic features",
          "Trackout stems included",
          "Up to 100,000 streams",
          "Unlimited music videos",
          "Commercial use rights",
          "Priority customer support"
        ];
      case 'exclusive':
        return [
          "All Premium features",
          "Exclusive ownership",
          "Unlimited streams",
          "Producer credit removal",
          "Full commercial rights",
          "Custom arrangements available"
        ];
    }
  };

  const licenseData = [
    {
      type: 'basic' as const,
      name: 'Basic License',
      popular: false,
      description: 'Perfect for independent artists'
    },
    {
      type: 'premium' as const,
      name: 'Premium License',
      popular: true,
      description: 'Most popular choice for professionals'
    },
    {
      type: 'exclusive' as const,
      name: 'Exclusive License',
      popular: false,
      description: 'Complete ownership and control'
    }
  ];

  const handleAddToCart = (licenseType: 'basic' | 'premium' | 'exclusive') => {
    toggleCartItem(beat, licenseType);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {licenseData.map((license) => {
        const price = getLicensePrice(license.type);
        const features = getLicenseFeatures(license.type);
        const isSelected = selectedLicense === license.type;
        const inCart = isInCart(beat.id, license.type);

        return (
          <Card 
            key={license.type}
            className={`relative cursor-pointer transition-all ${
              isSelected 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            } ${license.popular ? 'border-primary' : ''}`}
            onClick={() => onLicenseSelect(license.type)}
          >
            {license.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{license.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {license.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatCurrency(price, currency)}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3 mb-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                className="w-full" 
                variant={isSelected ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(license.type);
                }}
                disabled={inCart}
              >
                {inCart ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    In Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
