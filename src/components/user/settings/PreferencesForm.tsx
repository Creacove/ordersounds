
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PreferencesFormProps {
  initialEmailNotifications: boolean;
  initialPushNotifications: boolean;
  initialSmsNotifications: boolean;
  initialAutoPlayPreviews: boolean;
  initialDefaultCurrency: 'NGN' | 'USD';
}

export function PreferencesForm({
  initialEmailNotifications,
  initialPushNotifications,
  initialSmsNotifications,
  initialAutoPlayPreviews,
  initialDefaultCurrency
}: PreferencesFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(initialEmailNotifications);
  const [pushNotifications, setPushNotifications] = useState(initialPushNotifications);
  const [smsNotifications, setSmsNotifications] = useState(initialSmsNotifications);
  const [autoPlayPreviews, setAutoPlayPreviews] = useState(initialAutoPlayPreviews);
  const [defaultCurrency, setDefaultCurrency] = useState<'NGN' | 'USD'>(initialDefaultCurrency);
  const { user, updateProfile, setCurrency } = useAuth();

  const handleSavePreferences = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const settings = {
        emailNotifications,
        pushNotifications,
        smsNotifications,
        autoPlayPreviews
      };
      
      const { error } = await supabase
        .from('users')
        .update({
          settings: settings,
          default_currency: defaultCurrency
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      if (updateProfile) {
        await updateProfile({
          ...user,
          settings,
          default_currency: defaultCurrency
        });
        
        // Update currency in context if it changed
        if (setCurrency) {
          setCurrency(defaultCurrency);
        }

        // Store in localStorage
        try {
          localStorage.setItem('preferred_currency', defaultCurrency);
        } catch (err) {
          console.error('Error saving currency to localStorage:', err);
        }
        
        toast.success("Preferences updated successfully");
        setSaveSuccess(true);
        
        // Reset success state after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error("Failed to update preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Notification Settings</h3>
        
        <div className="flex items-center justify-between py-2">
          <div>
            <h4 className="text-base font-medium">Email Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Receive beat updates and important notifications via email
            </p>
          </div>
          <Switch 
            checked={emailNotifications} 
            onCheckedChange={setEmailNotifications}
          />
        </div>
        
        <div className="flex items-center justify-between py-2">
          <div>
            <h4 className="text-base font-medium">Push Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Receive in-app notifications for new beats and messages
            </p>
          </div>
          <Switch 
            checked={pushNotifications} 
            onCheckedChange={setPushNotifications} 
          />
        </div>
        
        <div className="flex items-center justify-between py-2">
          <div>
            <h4 className="text-base font-medium">SMS Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Receive important alerts via text message
            </p>
          </div>
          <Switch 
            checked={smsNotifications} 
            onCheckedChange={setSmsNotifications} 
          />
        </div>
      </div>
      
      <div className="border-t pt-4 space-y-4">
        <h3 className="text-lg font-medium">Display Settings</h3>
        
        <div className="flex items-center justify-between py-2">
          <div>
            <h4 className="text-base font-medium">Auto-Play Previews</h4>
            <p className="text-sm text-muted-foreground">
              Automatically play beat previews when viewed
            </p>
          </div>
          <Switch 
            checked={autoPlayPreviews} 
            onCheckedChange={setAutoPlayPreviews}
          />
        </div>

        <div className="space-y-2 pt-2">
          <Label htmlFor="currency">Default Currency</Label>
          <Select
            value={defaultCurrency}
            onValueChange={(value) => setDefaultCurrency(value as 'NGN' | 'USD')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This sets the default currency for browsing and purchasing beats
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          className="w-full md:w-auto bg-purple-600 hover:bg-purple-700"
          onClick={handleSavePreferences}
          disabled={isLoading}
          variant={saveSuccess ? "outline" : "default"}
        >
          {isLoading ? (
            <div className="flex items-center justify-center w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : saveSuccess ? (
            <div className="flex items-center justify-center w-full">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              <span>Saved</span>
            </div>
          ) : (
            <span>Save Preferences</span>
          )}
        </Button>
        
        {saveSuccess && (
          <span className="text-sm text-muted-foreground">Preferences saved successfully</span>
        )}
      </div>
    </div>
  );
}
