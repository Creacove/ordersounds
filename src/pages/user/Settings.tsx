import { useEffect } from "react";
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
      <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 md:mb-8 rounded-md overflow-hidden">
        <TabsTrigger value="profile" className="rounded-none border-0">Profile</TabsTrigger>
        <TabsTrigger value="payment" className="rounded-none border-0">Payment</TabsTrigger>
        <TabsTrigger value="preferences" className="rounded-none border-0">Preferences</TabsTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="stageName" size="lg">Stage Name</Label>
              <Input 
                id="stageName" 
                placeholder="Your stage name" 
                defaultValue={user.producer_name || ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio" size="lg">Bio</Label>
              <textarea 
                id="bio" 
                className="w-full min-h-32 p-2 rounded-md border border-input bg-background"
                placeholder="Tell buyers about yourself"
                defaultValue={user.bio || ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location" size="lg">Location</Label>
              <Input 
                id="location" 
                placeholder="Your location" 
                defaultValue={user.country || ''}
              />
            </div>
            
            <Button>
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
          <CardContent className="text-center py-10">
            <p className="text-base text-muted-foreground mb-4">Preference settings coming soon</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  // Buyer-specific tabs
  const buyerTabs = () => (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3 mb-8 rounded-md overflow-hidden">
        <TabsTrigger value="profile" className="rounded-none border-0">Profile</TabsTrigger>
        <TabsTrigger value="account" className="rounded-none border-0">Account</TabsTrigger>
        <TabsTrigger value="preferences" className="rounded-none border-0">Preferences</TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                placeholder="Your full name" 
                defaultValue={user.name}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                placeholder="Your email" 
                defaultValue={user.email}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input 
                id="country" 
                placeholder="Your country" 
                defaultValue={user.country || ''}
              />
            </div>
            
            <Button className="bg-purple-500 hover:bg-purple-600">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input 
                id="currentPassword" 
                type="password"
                placeholder="Enter current password" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password"
                placeholder="Enter new password" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                placeholder="Confirm new password" 
              />
            </div>
            
            <Button className="bg-purple-500 hover:bg-purple-600">
              Update Password
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="preferences">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <select 
                id="currency" 
                className="w-full p-2 rounded-md border border-input bg-background"
                defaultValue={user.default_currency || 'NGN'}
              >
                <option value="NGN">NGN - Nigerian Naira</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>
            
            <Button className="bg-purple-500 hover:bg-purple-600">
              Save Preferences
            </Button>
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
