
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProducerBankDetailsForm } from '@/components/payment/ProducerBankDetailsForm';
import { supabase } from "@/integrations/supabase/client";
import { Bell, Settings as SettingsIcon, DollarSign } from "lucide-react";
import { ProfileForm } from "@/components/producer/settings/ProfileForm";
import { ProfilePictureUploader } from "@/components/producer/settings/ProfilePictureUploader";
import { PaymentStatsSection } from "@/components/producer/settings/PaymentStatsSection";
import { PreferencesForm } from "@/components/producer/settings/PreferencesForm";

export default function ProducerSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [producerSettings, setProducerSettings] = useState<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    darkMode: boolean;
    autoPlayPreviews: boolean;
  }>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    darkMode: false,
    autoPlayPreviews: true
  });
  
  useEffect(() => {
    document.title = "Producer Settings | OrderSOUNDS";
    
    if (!user) {
      navigate('/login', { state: { from: '/producer/settings' } });
    } else if (user.role !== 'producer') {
      navigate('/');
    }
    
    if (user?.settings) {
      try {
        const settings = typeof user.settings === 'string' 
          ? JSON.parse(user.settings) 
          : user.settings;
          
        setProducerSettings({
          emailNotifications: settings.emailNotifications !== false,
          pushNotifications: settings.pushNotifications !== false,
          smsNotifications: settings.smsNotifications === true,
          darkMode: settings.darkMode === true,
          autoPlayPreviews: settings.autoPlayPreviews !== false
        });
      } catch (e) {
        console.error("Error parsing user settings:", e);
      }
    }
  }, [user, navigate]);

  const handleBankDetailsSuccess = () => {
    // No need to reload the page
    if (user) {
      // Refresh the bank details data
      supabase
        .from('users')
        .select('bank_code, account_number, verified_account_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            console.log("Updated bank details:", data);
          }
        });
    }
  };

  if (!user || user.role !== 'producer') {
    return (
      <MainLayout>
        <div className="container py-16 pb-32">
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
        "container py-6 md:py-8 pb-32",
        isMobile ? "mobile-content-padding" : ""
      )}>
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Producer Settings</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 md:mb-8 overflow-hidden">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <SettingsIcon className="w-4 h-4" />
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
                <ProfilePictureUploader 
                  avatarUrl={user.avatar_url || null} 
                  displayName={user.producer_name || user.name || 'User'}
                />

                <ProfileForm
                  initialProducerName={user.producer_name || user.name || ''}
                  initialBio={user.bio || ''}
                  initialLocation={user.country || ''}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl">Payment Account</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Set up your bank account to receive earnings from your beat sales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProducerBankDetailsForm 
                    producerId={user.id}
                    existingBankCode={user.bank_code}
                    existingAccountNumber={user.account_number}
                    existingAccountName={user.verified_account_name}
                    onSuccess={handleBankDetailsSuccess}
                  />
                </CardContent>
              </Card>
              
              <PaymentStatsSection 
                userId={user.id}
                hasVerifiedAccount={!!user.verified_account_name}
                verifiedAccountName={user.verified_account_name}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Preferences</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Customize your producer experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PreferencesForm 
                  initialEmailNotifications={producerSettings.emailNotifications}
                  initialPushNotifications={producerSettings.pushNotifications}
                  initialSmsNotifications={producerSettings.smsNotifications}
                  initialDarkMode={producerSettings.darkMode}
                  initialAutoPlayPreviews={producerSettings.autoPlayPreviews}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
