
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProducerBankDetailsForm } from '@/components/payment/ProducerBankDetailsForm';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Bell, Settings, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function ProducerSettings() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [producerName, setProducerName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  useEffect(() => {
    document.title = "Producer Settings | OrderSOUNDS";
    
    // Redirect to login if not authenticated or not a producer
    if (!user) {
      navigate('/login', { state: { from: '/producer/settings' } });
    } else if (user.role !== 'producer') {
      navigate('/');
    }
    
    // Set initial values
    if (user) {
      setProducerName(user.producer_name || '');
      setBio(user.bio || '');
      setLocation(user.country || '');
      
      // Get notification preferences from user settings if available
      if (user.settings) {
        try {
          const settings = typeof user.settings === 'string' 
            ? JSON.parse(user.settings) 
            : user.settings;
            
          setEmailNotifications(settings.emailNotifications !== false);
          setPushNotifications(settings.pushNotifications !== false);
        } catch (e) {
          console.error("Error parsing user settings:", e);
        }
      }
    }
  }, [user, navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Update producer info in database
      const { error } = await supabase
        .from('users')
        .update({
          producer_name: producerName,
          bio: bio,
          country: location
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local user context
      if (updateProfile) {
        await updateProfile({
          ...user,
          producer_name: producerName,
          bio: bio,
          country: location
        });
        
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const settings = {
        emailNotifications,
        pushNotifications
      };
      
      // Update preferences in database
      const { error } = await supabase
        .from('users')
        .update({
          settings: settings
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local user context
      if (updateProfile) {
        await updateProfile({
          ...user,
          settings
        });
        
        toast.success('Preferences updated successfully');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBankDetailsSuccess = () => {
    toast.success('Bank details saved successfully');
  };

  // If not logged in or not a producer, show login prompt
  if (!user || user.role !== 'producer') {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Producer Access Required</h1>
            <p className="text-base mb-4">You need to be logged in as a producer to access this page.</p>
            <Button onClick={() => navigate('/login')}>Login</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={cn(
        "container py-6 md:py-8",
        isMobile ? "mobile-content-padding" : ""
      )}>
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Producer Settings</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 md:mb-8 overflow-hidden">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <Settings className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>Payment</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-1">
              <Bell className="w-4 h-4" />
              <span>Preferences</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Profile Information</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Update your producer profile information that will be visible to buyers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stageName" size="lg">Stage Name</Label>
                  <Input 
                    id="stageName" 
                    placeholder="Your stage name" 
                    value={producerName}
                    onChange={(e) => setProducerName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio" size="lg">Bio</Label>
                  <textarea 
                    id="bio" 
                    className="w-full min-h-32 p-2 rounded-md border border-input bg-background"
                    placeholder="Tell buyers about yourself"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" size="lg">Location</Label>
                  <Input 
                    id="location" 
                    placeholder="Your location" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="w-full md:w-auto"
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Payment Settings</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Configure your bank details to receive payments for your beats
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user && (
                  <ProducerBankDetailsForm 
                    producerId={user.id}
                    existingBankCode={user.bank_code}
                    existingAccountNumber={user.account_number}
                    existingAccountName={user.verified_account_name}
                    onSuccess={handleBankDetailsSuccess}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Preferences</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Customize your producer experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Settings</h3>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="text-base font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive beat sales and important updates via email
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
                        Receive in-app notifications for sales and messages
                      </p>
                    </div>
                    <Switch 
                      checked={pushNotifications} 
                      onCheckedChange={setPushNotifications} 
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full md:w-auto"
                  onClick={handleSavePreferences}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
