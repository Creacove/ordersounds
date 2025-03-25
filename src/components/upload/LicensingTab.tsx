
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileKey } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BeatDetails, LicenseOption } from "@/hooks/useBeatUpload";

type LicensingTabProps = {
  beatDetails: BeatDetails;
  handleBeatChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  licenseOptions: LicenseOption[];
  handleLicenseTypeChange: (optionValue: string, isChecked: boolean) => void;
  selectedLicenseTypes: string[];
};

export const LicensingTab = ({
  beatDetails,
  handleBeatChange,
  licenseOptions,
  handleLicenseTypeChange,
  selectedLicenseTypes
}: LicensingTabProps) => {
  return (
    <div className="space-y-4">
      <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
        <FileKey className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium">License Options</h3>
          <p className="text-xs text-muted-foreground">
            Select one or more license options for your beat. Each license type comes with different rights and pricing.
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {licenseOptions.map((option) => (
          <div key={option.value} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id={`license-${option.value}`} 
                  checked={selectedLicenseTypes.includes(option.value)}
                  onCheckedChange={(checked) => handleLicenseTypeChange(option.value, !!checked)}
                  className="mt-1" 
                />
                <div>
                  <Label htmlFor={`license-${option.value}`} className="font-medium">{option.label}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                </div>
              </div>
            </div>
            
            {option.value !== 'custom' ? (
              <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs">
                <p>{option.terms}</p>
              </div>
            ) : (
              selectedLicenseTypes.includes('custom') && (
                <div className="mt-4">
                  <Label htmlFor="licenseTerms">Custom License Terms</Label>
                  <Textarea 
                    id="licenseTerms" 
                    name="licenseTerms"
                    value={beatDetails.licenseTerms}
                    onChange={handleBeatChange}
                    placeholder="Describe the terms and conditions of your custom license..." 
                    rows={4}
                    className="mt-1.5"
                  />
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
