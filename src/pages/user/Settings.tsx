
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { ProfileForm } from "@/components/user/settings/ProfileForm";
import { AccountForm } from "@/components/user/settings/AccountForm";
import { PreferencesForm } from "@/components/user/settings/PreferencesForm";
import { User } from "@/components/ui/user";
import { Shield, Settings } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    document.title = "Settings | OrderSOUNDS";
    
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login', { state: { from: '/settings' } });
    }
  }, [user, navigate]);

  // If not logged in, show login prompt
  if (!user) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Login to Access Settings</h1>
            <Button onClick={() => navigate('/login')}>Login</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Producer-specific tabs
  const producerTabs = () => (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="border-b w-full mb-6 md:mb-8 rounded-none p-0 h-auto bg-transparent">
        <TabsTrigger value="profile" className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none py-3 px-4">
          <User className="mr-2 h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="payment" className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none py-3 px-4">
          Payment
        </TabsTrigger>
        <TabsTrigger value="preferences" className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none py-3 px-4">
          <Settings className="mr-2 h-4 w-4" />
          Preferences
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Producer Profile</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Update your producer profile information that will be visible to buyers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileForm 
              initialProducerName={user.producer_name || ''}
              initialBio={user.bio || ''}
              initialLocation={user.country || ''}
              avatarUrl={user.avatar_url || null}
              displayName={user.producer_name || user.name || 'User'}
              initialMusicInterests={user.music_interests || []}
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="payment">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Payment Settings</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Configure how you'll receive payments for your beats
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-10">
            <p className="text-base text-muted-foreground mb-4">Payment settings coming soon</p>
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
          <CardContent>
            <PreferencesForm 
              initialEmailNotifications={user.settings?.emailNotifications || true}
              initialPushNotifications={user.settings?.pushNotifications || true}
              initialSmsNotifications={user.settings?.smsNotifications || false}
              initialAutoPlayPreviews={user.settings?.autoPlayPreviews || true}
              initialDefaultCurrency={user.default_currency || 'NGN'}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  // Buyer-specific tabs
  const buyerTabs = () => (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="border-b w-full mb-6 md:mb-8 rounded-none p-0 h-auto bg-transparent">
        <TabsTrigger value="profile" className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none py-3 px-4">
          <User className="mr-2 h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="account" className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none py-3 px-4">
          <Shield className="mr-2 h-4 w-4" />
          Account
        </TabsTrigger>
        <TabsTrigger value="preferences" className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none py-3 px-4">
          <Settings className="mr-2 h-4 w-4" />
          Preferences
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Profile Information</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileForm 
              initialProducerName=""
              initialBio={user.bio || ""}
              initialLocation={user.country || ''}
              avatarUrl={user.avatar_url || null}
              displayName={user.name || 'User'}
              isBuyer={true}
              initialFullName={user.name || ''}
              initialMusicInterests={user.music_interests || []}
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Account Security</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccountForm 
              userEmail={user.email}
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="preferences">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Preferences</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Customize your experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PreferencesForm 
              initialEmailNotifications={user.settings?.emailNotifications || true}
              initialPushNotifications={user.settings?.pushNotifications || true} 
              initialSmsNotifications={user.settings?.smsNotifications || false}
              initialAutoPlayPreviews={user.settings?.autoPlayPreviews || true}
              initialDefaultCurrency={user.default_currency || 'NGN'}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  return (
    <MainLayout>
      <div className={cn(
        "container py-6 md:py-8",
        isMobile ? "mobile-content-padding" : ""
      )}>
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">
          {user.role === "producer" ? "Producer Settings" : "Account Settings"}
        </h1>
        
        {user.role === "producer" ? producerTabs() : buyerTabs()}
      </div>
    </MainLayout>
  );
}
