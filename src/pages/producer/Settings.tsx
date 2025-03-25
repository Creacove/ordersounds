
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

export default function ProducerSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    document.title = "Producer Settings | OrderSOUNDS";
    
    // Redirect to login if not authenticated or not a producer
    if (!user) {
      navigate('/login', { state: { from: '/producer/settings' } });
    } else if (user.role !== 'producer') {
      navigate('/');
    }
  }, [user, navigate]);

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
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 md:mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
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
      </div>
    </MainLayout>
  );
}
