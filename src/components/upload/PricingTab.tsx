
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";
import { BeatDetails } from "@/hooks/useBeatUpload";

type PricingTabProps = {
  beatDetails: BeatDetails;
  setBeatDetails: React.Dispatch<React.SetStateAction<BeatDetails>>;
};

export const PricingTab = ({
  beatDetails,
  setBeatDetails
}: PricingTabProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium">License Pricing</h3>
          <p className="text-xs text-muted-foreground">
            Set different prices for each license type in both local (NGN) and international (USD) currencies. 
            Buyers will be able to choose which license they want to purchase.
          </p>
        </div>
      </div>
      
      {/* Basic License Pricing */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3">Basic License</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="basicLicensePriceLocal">Local Price (NGN) *</Label>
            <div className="flex items-center mt-1.5">
              <div className="bg-muted flex items-center justify-center h-10 px-3 rounded-l-md border-y border-l">
                ₦
              </div>
              <Input
                id="basicLicensePriceLocal"
                name="basicLicensePriceLocal"
                type="number"
                value={beatDetails.basicLicensePriceLocal}
                onChange={(e) => setBeatDetails({...beatDetails, basicLicensePriceLocal: parseInt(e.target.value) || 0})}
                className="rounded-l-none"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="basicLicensePriceDiaspora">International Price (USD) *</Label>
            <div className="flex items-center mt-1.5">
              <div className="bg-muted flex items-center justify-center h-10 px-3 rounded-l-md border-y border-l">
                $
              </div>
              <Input
                id="basicLicensePriceDiaspora"
                name="basicLicensePriceDiaspora"
                type="number"
                value={beatDetails.basicLicensePriceDiaspora}
                onChange={(e) => setBeatDetails({...beatDetails, basicLicensePriceDiaspora: parseInt(e.target.value) || 0})}
                className="rounded-l-none"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Premium License Pricing */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3">Premium License</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="premiumLicensePriceLocal">Local Price (NGN) *</Label>
            <div className="flex items-center mt-1.5">
              <div className="bg-muted flex items-center justify-center h-10 px-3 rounded-l-md border-y border-l">
                ₦
              </div>
              <Input
                id="premiumLicensePriceLocal"
                name="premiumLicensePriceLocal"
                type="number"
                value={beatDetails.premiumLicensePriceLocal}
                onChange={(e) => setBeatDetails({...beatDetails, premiumLicensePriceLocal: parseInt(e.target.value) || 0})}
                className="rounded-l-none"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="premiumLicensePriceDiaspora">International Price (USD) *</Label>
            <div className="flex items-center mt-1.5">
              <div className="bg-muted flex items-center justify-center h-10 px-3 rounded-l-md border-y border-l">
                $
              </div>
              <Input
                id="premiumLicensePriceDiaspora"
                name="premiumLicensePriceDiaspora"
                type="number"
                value={beatDetails.premiumLicensePriceDiaspora}
                onChange={(e) => setBeatDetails({...beatDetails, premiumLicensePriceDiaspora: parseInt(e.target.value) || 0})}
                className="rounded-l-none"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Exclusive License Pricing */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3">Exclusive License</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="exclusiveLicensePriceLocal">Local Price (NGN) *</Label>
            <div className="flex items-center mt-1.5">
              <div className="bg-muted flex items-center justify-center h-10 px-3 rounded-l-md border-y border-l">
                ₦
              </div>
              <Input
                id="exclusiveLicensePriceLocal"
                name="exclusiveLicensePriceLocal"
                type="number"
                value={beatDetails.exclusiveLicensePriceLocal}
                onChange={(e) => setBeatDetails({...beatDetails, exclusiveLicensePriceLocal: parseInt(e.target.value) || 0})}
                className="rounded-l-none"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="exclusiveLicensePriceDiaspora">International Price (USD) *</Label>
            <div className="flex items-center mt-1.5">
              <div className="bg-muted flex items-center justify-center h-10 px-3 rounded-l-md border-y border-l">
                $
              </div>
              <Input
                id="exclusiveLicensePriceDiaspora"
                name="exclusiveLicensePriceDiaspora"
                type="number"
                value={beatDetails.exclusiveLicensePriceDiaspora}
                onChange={(e) => setBeatDetails({...beatDetails, exclusiveLicensePriceDiaspora: parseInt(e.target.value) || 0})}
                className="rounded-l-none"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom License Pricing */}
      {beatDetails.licenseType === 'custom' && (
        <div className="border rounded-lg p-4 border-primary/50">
          <h3 className="font-medium mb-3">Custom License</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customLicensePriceLocal">Local Price (NGN) *</Label>
              <div className="flex items-center mt-1.5">
                <div className="bg-muted flex items-center justify-center h-10 px-3 rounded-l-md border-y border-l">
                  ₦
                </div>
                <Input
                  id="customLicensePriceLocal"
                  name="customLicensePriceLocal"
                  type="number"
                  value={beatDetails.customLicensePriceLocal}
                  onChange={(e) => setBeatDetails({...beatDetails, customLicensePriceLocal: parseInt(e.target.value) || 0})}
                  className="rounded-l-none"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="customLicensePriceDiaspora">International Price (USD) *</Label>
              <div className="flex items-center mt-1.5">
                <div className="bg-muted flex items-center justify-center h-10 px-3 rounded-l-md border-y border-l">
                  $
                </div>
                <Input
                  id="customLicensePriceDiaspora"
                  name="customLicensePriceDiaspora"
                  type="number"
                  value={beatDetails.customLicensePriceDiaspora}
                  onChange={(e) => setBeatDetails({...beatDetails, customLicensePriceDiaspora: parseInt(e.target.value) || 0})}
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
