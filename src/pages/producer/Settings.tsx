
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
import { Loader2, Bell, Settings as SettingsIcon, DollarSign, CreditCard, Clock, Activity, CheckCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from '@/utils/formatters';

export default function ProducerSettings() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({
    profile: false,
    preferences: false
  });
  const [saveSuccess, setSaveSuccess] = useState<{[key: string]: boolean}>({
    profile: false,
    preferences: false
  });
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

  // Reset success indicator after 3 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    Object.keys(saveSuccess).forEach(key => {
      if (saveSuccess[key]) {
        const timer = setTimeout(() => {
          setSaveSuccess(prev => ({
            ...prev,
            [key]: false
          }));
        }, 3000);
        timers.push(timer);
      }
    });
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [saveSuccess]);

  const fetchPaymentAnalytics = async () => {
    if (!user) return;
    
    try {
      setLoadingAnalytics(true);
      
      // Get total earnings from payments table - FIX: Using proper order syntax
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          amount, 
          producer_share,
          status,
          payment_date,
          transaction_reference,
          order_id
        `)
        .eq('status', 'successful')
        .order('payment_date', { ascending: false });
        
      if (paymentsError) throw paymentsError;
      
      // Get payout data
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (payoutsError) throw payoutsError;
      
      // Get recent transactions by joining line_items, orders and beats - FIX: Using proper order syntax
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('line_items')
        .select(`
          id,
          price_charged,
          currency_code,
          orders!inner(order_date, status, payment_reference),
          beats!inner(title, id)
        `)
        .eq('orders.status', 'completed')
        .order('id', { ascending: false })
        .limit(5);
        
      if (transactionsError) throw transactionsError;
      
      // Calculate analytics
      const totalEarnings = paymentsData.reduce((sum, payment) => sum + (payment.producer_share || 0), 0);
      
      const completedPayouts = payoutsData?.filter(p => p.status === 'successful') || [];
      const pendingPayouts = payoutsData?.filter(p => p.status === 'pending') || [];
      
      const pendingBalance = totalEarnings - completedPayouts.reduce((sum, payout) => sum + payout.amount, 0);
      
      // Format transactions for display
      const recentTransactions = transactionsData?.map(item => ({
        id: item.id,
        beat_title: item.beats.title,
        beat_id: item.beats.id,
        date: item.orders.order_date,
        amount: item.price_charged,
        currency: item.currency_code,
        status: item.orders.status,
        reference: item.orders.payment_reference
      })) || [];
      
      setPaymentAnalytics({
        total_earnings: totalEarnings,
        pending_balance: pendingBalance,
        successful_payments: completedPayouts.length,
        pending_payments: pendingPayouts.length,
        recent_transactions: recentTransactions
      });
    } catch (error) {
      console.error("Error fetching payment analytics:", error);
      toast.error("Failed to load payment analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(prev => ({ ...prev, profile: true }));
      
      // Update producer info in database
      const { error } = await supabase
        .from('users')
        .update({
          stage_name: producerName,
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
        setSaveSuccess(prev => ({ ...prev, profile: true }));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    
    try {
      setIsLoading(prev => ({ ...prev, preferences: true }));
      
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
        setSaveSuccess(prev => ({ ...prev, preferences: true }));
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, preferences: false }));
    }
  };

  const handleBankDetailsSuccess = () => {
    toast.success('Bank details saved successfully');
    fetchPaymentAnalytics(); // Refresh payment analytics after successful bank update
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
                
                <div className="flex items-center gap-2">
                  <Button 
                    className="w-full md:w-auto"
                    onClick={handleSaveProfile}
                    disabled={isLoading.profile}
                    variant={saveSuccess.profile ? "outline" : "default"}
                  >
                    {isLoading.profile ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : saveSuccess.profile ? (
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    ) : null}
                    {saveSuccess.profile ? "Saved" : "Save Changes"}
                  </Button>
                  
                  {saveSuccess.profile && (
                    <span className="text-sm text-muted-foreground">Changes saved successfully</span>
                  )}
                </div>
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
                          <p className="text-xl font-bold">{formatCurrency(paymentAnalytics.total_earnings)}</p>
                        </div>
                        
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium text-muted-foreground">Pending Balance</span>
                          </div>
                          <p className="text-xl font-bold">{formatCurrency(paymentAnalytics.pending_balance)}</p>
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
                                    <td className="py-2 px-4 text-sm">{formatCurrency(transaction.amount, transaction.currency)}</td>
                                    <td className="py-2 px-4 text-sm">
                                      <span className={cn("px-2 py-1 rounded-full text-xs", {
                                        "bg-green-100 text-green-800": transaction.status === 'completed',
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
                
                <div className="flex items-center gap-2">
                  <Button 
                    className="w-full md:w-auto"
                    onClick={handleSavePreferences}
                    disabled={isLoading.preferences}
                    variant={saveSuccess.preferences ? "outline" : "default"}
                  >
                    {isLoading.preferences ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : saveSuccess.preferences ? (
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    ) : null}
                    {saveSuccess.preferences ? "Saved" : "Save Preferences"}
                  </Button>
                  
                  {saveSuccess.preferences && (
                    <span className="text-sm text-muted-foreground">Preferences saved successfully</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
