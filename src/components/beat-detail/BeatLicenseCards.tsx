
import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Beat } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface BeatLicenseCardsProps {
  beat: Beat;
  currency: 'NGN' | 'USD';
  onLicenseSelect: (license: 'basic' | 'premium' | 'exclusive') => void;
  selectedLicense: 'basic' | 'premium' | 'exclusive';
}

export const BeatLicenseCards = ({ 
  beat, 
  currency, 
  onLicenseSelect, 
  selectedLicense 
}: BeatLicenseCardsProps) => {
  const { addToCart, isInCart } = useCart();

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
          "MP3 Format",
          "Non-commercial use",
          "Up to 5,000 streams",
          "No radio/TV broadcasts"
        ];
      case 'premium':
        return [
          "WAV Format",
          "Commercial use",
          "Unlimited streams",
          "Limited broadcasting rights"
        ];
      case 'exclusive':
        return [
          "WAV + Trackout Files",
          "Full ownership rights",
          "Unlimited distribution",
          "Full broadcasting rights"
        ];
    }
  };

  const licenseData = [
    {
      type: 'basic' as const,
      name: 'Basic License',
      popular: false,
    },
    {
      type: 'premium' as const,
      name: 'Premium License',
      popular: true,
    },
    {
      type: 'exclusive' as const,
      name: 'Exclusive License',
      popular: false,
    }
  ];

  const handleAddToCart = (licenseType: 'basic' | 'premium' | 'exclusive') => {
    const beatWithLicense = {
      ...beat,
      selected_license: licenseType
    };
    addToCart(beatWithLicense);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {licenseData.map((license) => {
        const price = getLicensePrice(license.type);
        const features = getLicenseFeatures(license.type);
        const isSelected = selectedLicense === license.type;
        const inCart = isInCart(beat.id);
        const isPremium = license.type === 'premium';

        return (
          <Card 
            key={license.type}
            className={`relative cursor-pointer transition-all border-2 ${
              isSelected 
                ? 'border-purple-500 bg-gray-900' 
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            } ${isPremium ? 'border-purple-500' : ''}`}
            onClick={() => onLicenseSelect(license.type)}
          >
            {isPremium && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Popular
                </div>
              </div>
            )}
            
            <CardContent className="p-4 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">{license.name}</h3>
                <div className="text-2xl font-bold text-purple-400 mt-2">
                  {formatCurrency(price, currency)}
                </div>
              </div>
              
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {feature.includes("No ") ? (
                      <div className="w-4 h-4 rounded-full border border-red-500 flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-red-500"></div>
                      </div>
                    ) : (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                    <span className={feature.includes("No ") ? "text-red-400" : "text-gray-300"}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              
              <Button 
                className={`w-full ${
                  isPremium 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                } text-white`}
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
