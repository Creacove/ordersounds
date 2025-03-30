
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
import { supabase } from "@/lib/supabase";
import { Loader2, Bell, Settings, DollarSign, CreditCard, Clock, Activity } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { usePaystackSplit } from '@/hooks/payment/usePaystackSplit';
import { getProducerPaymentAnalytics } from '@/utils/payment/paystackSplitUtils';

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
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [paymentAnalytics, setPaymentAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [autoPlayPreviews, setAutoPlayPreviews] = useState(true);
  
  const { accountName } = usePaystackSplit();
  
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
          setSmsNotifications(settings.smsNotifications === true);
          setDarkMode(settings.darkMode === true);
          setAutoPlayPreviews(settings.autoPlayPreviews !== false);
        } catch (e) {
          console.error("Error parsing user settings:", e);
        }
      }
      
      // Fetch payment analytics
      fetchPaymentAnalytics();
    }
  }, [user, navigate]);

  const fetchPaymentAnalytics = async () => {
    if (!user) return;
    
    try {
      setLoadingAnalytics(true);
      const analytics = await getProducerPaymentAnalytics(user.id);
      setPaymentAnalytics(analytics);
    } catch (error) {
      console.error("Error fetching payment analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

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
        pushNotifications,
        smsNotifications,
        darkMode,
        autoPlayPreviews
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
    fetchPaymentAnalytics(); // Refresh payment analytics after successful bank update
  };

  // Format currency
  const formatCurrency = (amount: number, currency = 'NGN') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(amount || 0);
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
            <div className="space-y-6">
              {/* Bank Details Setup Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl">Payment Account</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Set up your bank account to receive earnings from your beat sales
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
              
              {/* Payment Analytics Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl">Payment Stats</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Overview of your earnings and payment history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingAnalytics ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading payment stats...</p>
                      </div>
                    </div>
                  ) : paymentAnalytics ? (
                    <div className="space-y-6">
                      {/* Payment Stats Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-muted-foreground">Total Earnings</span>
                          </div>
                          <p className="text-xl font-bold">{formatCurrency(paymentAnalytics.total_earnings/100)}</p>
                        </div>
                        
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium text-muted-foreground">Pending Balance</span>
                          </div>
                          <p className="text-xl font-bold">{formatCurrency(paymentAnalytics.pending_balance/100)}</p>
                        </div>
                        
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-muted-foreground">Completed Payments</span>
                          </div>
                          <p className="text-xl font-bold">{paymentAnalytics.successful_payments}</p>
                        </div>
                      </div>
                      
                      {/* Recent Transactions */}
                      {paymentAnalytics.recent_transactions && paymentAnalytics.recent_transactions.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-base font-semibold">Recent Transactions</h3>
                          <div className="border rounded-lg overflow-hidden">
                            <table className="min-w-full">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="py-2 px-4 text-left text-xs font-medium text-muted-foreground">Date</th>
                                  <th className="py-2 px-4 text-left text-xs font-medium text-muted-foreground">Beat</th>
                                  <th className="py-2 px-4 text-left text-xs font-medium text-muted-foreground">Amount</th>
                                  <th className="py-2 px-4 text-left text-xs font-medium text-muted-foreground">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {paymentAnalytics.recent_transactions.map((transaction: any, index: number) => (
                                  <tr key={transaction.id || index}>
                                    <td className="py-2 px-4 text-sm">{new Date(transaction.date).toLocaleDateString()}</td>
                                    <td className="py-2 px-4 text-sm">{transaction.beat_title}</td>
                                    <td className="py-2 px-4 text-sm">{formatCurrency(transaction.amount/100)}</td>
                                    <td className="py-2 px-4 text-sm">
                                      <span className={cn("px-2 py-1 rounded-full text-xs", {
                                        "bg-green-100 text-green-800": transaction.status === 'successful',
                                        "bg-amber-100 text-amber-800": transaction.status === 'pending',
                                        "bg-red-100 text-red-800": transaction.status === 'failed'
                                      })}>
                                        {transaction.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Payment Account Status */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-base font-semibold text-blue-800 mb-2">Payment Account Status</h3>
                        <p className="text-sm text-blue-700 mb-2">
                          {user.verified_account_name 
                            ? `Your account is set up for automatic payments to ${user.verified_account_name}`
                            : "Please set up your bank details to receive automatic payments"}
                        </p>
                        <p className="text-xs text-blue-600">
                          Payments for beat sales are automatically split with 90% going to your account
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">
                        {user.verified_account_name 
                          ? "No payment data available yet. Start selling beats to see your earnings!"
                          : "Please set up your bank details above to start receiving payments"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
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
                      <h4 className="text-base font-medium">Dark Mode</h4>
                      <p className="text-sm text-muted-foreground">
                        Use dark theme for the dashboard
                      </p>
                    </div>
                    <Switch 
                      checked={darkMode} 
                      onCheckedChange={setDarkMode}
                    />
                  </div>
                  
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
