
import { useEffect, useState, useRef } from "react";
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
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Bell, Settings as SettingsIcon, DollarSign, CreditCard, Clock, Activity, CheckCircle, Upload, Camera } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from '@/utils/formatters';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getInitials } from "@/utils/formatters";

interface Transaction {
  id: string;
  beat_title: string;
  beat_id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
}

interface PaymentAnalytics {
  total_earnings: number;
  pending_balance: number;
  successful_payments: number;
  pending_payments: number;
  recent_transactions: Transaction[];
}

export default function ProducerSettings() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({
    profile: false,
    preferences: false,
    avatar: false
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
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [autoPlayPreviews, setAutoPlayPreviews] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    document.title = "Producer Settings | OrderSOUNDS";
    
    if (!user) {
      navigate('/login', { state: { from: '/producer/settings' } });
    } else if (user.role !== 'producer') {
      navigate('/');
    }
    
    if (user) {
      setProducerName(user.producer_name || user.name || '');
      setBio(user.bio || '');
      setLocation(user.country || '');
      setAvatarUrl(user.avatar_url || '');
      
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
      
      fetchPaymentAnalytics();
    }
  }, [user, navigate]);

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
      
      // Get producer's beats
      const { data: producerBeats, error: beatsError } = await supabase
        .from('beats')
        .select('id')
        .eq('producer_id', user.id);
        
      if (beatsError) throw beatsError;
      
      if (!producerBeats || producerBeats.length === 0) {
        setPaymentAnalytics({
          total_earnings: 0,
          pending_balance: 0,
          successful_payments: 0,
          pending_payments: 0,
          recent_transactions: []
        });
        setLoadingAnalytics(false);
        return;
      }
      
      const beatIds = producerBeats.map(beat => beat.id);
      
      // Get transactions for producer's beats only
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('line_items')
        .select(`
          id,
          price_charged,
          currency_code,
          beat_id,
          order_id,
          orders:order_id(
            order_date, 
            status, 
            payment_reference
          ),
          beats:beat_id(
            title,
            id
          )
        `)
        .in('beat_id', beatIds);
        
      if (transactionsError) throw transactionsError;
      
      // Get payouts for this producer
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (payoutsError) throw payoutsError;

      const recentTransactions: Transaction[] = (transactionsData || [])
        .filter(item => item && item.orders && item.beats)
        .map(item => ({
          id: item.id,
          beat_title: item.beats?.title || 'Untitled Beat',
          beat_id: item.beat_id || '',
          date: item.orders?.order_date || '',
          amount: item.price_charged || 0,
          currency: item.currency_code || 'NGN',
          status: item.orders?.status || 'unknown',
          reference: item.orders?.payment_reference || ''
        })) || [];
      
      // Calculate total earnings from transactions (90% goes to producer)
      const totalEarnings = recentTransactions.reduce((sum, transaction) => {
        return transaction.status === 'completed' ? sum + (transaction.amount * 0.9) : sum;
      }, 0);
      
      // Calculate total paid out from completed payouts
      const completedPayouts = payoutsData?.filter(p => p.status === 'successful') || [];
      const pendingPayouts = payoutsData?.filter(p => p.status === 'pending') || [];
      const totalPaidOut = completedPayouts.reduce((sum, payout) => sum + payout.amount, 0);
      
      // Calculate pending balance as the difference between total earnings and paid out amount
      const pendingBalance = totalEarnings - totalPaidOut;
      
      setPaymentAnalytics({
        total_earnings: totalEarnings,
        pending_balance: pendingBalance,
        successful_payments: completedPayouts.length,
        pending_payments: pendingPayouts.length,
        recent_transactions: recentTransactions
      });
    } catch (error) {
      console.error("Error fetching payment analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load payment analytics",
        variant: "destructive"
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(prev => ({ ...prev, profile: true }));
      
      const { error } = await supabase
        .from('users')
        .update({
          stage_name: producerName,
          bio: bio,
          country: location
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      if (updateProfile) {
        await updateProfile({
          ...user,
          producer_name: producerName,
          name: user.name,
          bio: bio,
          country: location
        });
        
        toast({
          title: "Success",
          description: "Profile updated successfully",
          variant: "default"
        });
        setSaveSuccess(prev => ({ ...prev, profile: true }));
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
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
      
      const { error } = await supabase
        .from('users')
        .update({
          settings: settings
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      if (updateProfile) {
        await updateProfile({
          ...user,
          settings
        });
        
        toast({
          title: "Success",
          description: "Preferences updated successfully",
          variant: "default"
        });
        setSaveSuccess(prev => ({ ...prev, preferences: true }));
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, preferences: false }));
    }
  };

  const handleBankDetailsSuccess = () => {
    toast({
      title: "Success",
      description: "Bank details saved successfully",
      variant: "default"
    });
    
    // Do not reload the page, just fetch updated user data
    if (user && updateProfile) {
      supabase
        .from('users')
        .select('bank_code, account_number, verified_account_name')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            updateProfile({
              ...user,
              bank_code: data.bank_code,
              account_number: data.account_number,
              verified_account_name: data.verified_account_name
            });
          }
        });
    }
    
    // Update payment analytics without full page reload
    fetchPaymentAnalytics();
  };
  
  const handleChooseFileClick = () => {
    // Trigger the hidden file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 2MB",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(prev => ({ ...prev, avatar: true }));
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!event.target || !event.target.result) return;
        
        const base64String = event.target.result.toString();
        
        const { error } = await supabase
          .from('users')
          .update({ profile_picture: base64String })
          .eq('id', user!.id);
          
        if (error) throw error;
        
        setAvatarUrl(base64String);
        
        if (updateProfile) {
          await updateProfile({
            ...user!,
            avatar_url: base64String
          });
        }
        
        toast({
          title: "Success",
          description: "Profile picture updated successfully",
          variant: "default"
        });
        setIsAvatarDialogOpen(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast({
        title: "Error",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, avatar: false }));
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
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={avatarUrl || undefined} alt={producerName} />
                      <AvatarFallback>{getInitials(producerName || user.name || 'User')}</AvatarFallback>
                    </Avatar>
                    <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Profile Picture</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <p className="text-sm text-muted-foreground">
                            Select an image to use as your profile picture. Files should be JPG, PNG or GIF and less than 2MB.
                          </p>
                          <div className="flex flex-col items-center justify-center gap-4">
                            <Avatar className="h-32 w-32">
                              <AvatarImage src={avatarUrl || undefined} alt={producerName} />
                              <AvatarFallback>{getInitials(producerName || user.name || 'User')}</AvatarFallback>
                            </Avatar>
                            
                            {/* Hidden file input */}
                            <input 
                              ref={fileInputRef}
                              id="avatar-upload" 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleAvatarChange}
                              disabled={isLoading.avatar}
                            />
                            
                            <Button 
                              variant="outline" 
                              className="cursor-pointer"
                              disabled={isLoading.avatar}
                              onClick={handleChooseFileClick}
                            >
                              {isLoading.avatar ? (
                                <div className="flex items-center justify-center w-full">
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  <span>Uploading...</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  <span>Choose File</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Click the camera icon to update your profile picture
                  </p>
                </div>

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
                      <div className="flex items-center justify-center w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : saveSuccess.profile ? (
                      <div className="flex items-center justify-center w-full">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        <span>Saved</span>
                      </div>
                    ) : (
                      <span>Save Changes</span>
                    )}
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
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl">Payment Stats</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Overview of your earnings and payment history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingAnalytics ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <p className="text-muted-foreground">Loading payment stats...</p>
                    </div>
                  ) : paymentAnalytics ? (
                    <div className="space-y-6">
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
                            <span className="text-sm font-medium text-muted-foreground">Completed Payouts</span>
                          </div>
                          <p className="text-xl font-bold">{paymentAnalytics.successful_payments}</p>
                        </div>
                      </div>
                      
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
                                {paymentAnalytics.recent_transactions
                                  .filter(transaction => transaction.status === 'completed')
                                  .map((transaction) => (
                                    <tr key={transaction.id}>
                                      <td className="py-2 px-4 text-sm">{transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}</td>
                                      <td className="py-2 px-4 text-sm">{transaction.beat_title}</td>
                                      <td className="py-2 px-4 text-sm">{formatCurrency(transaction.amount * 0.9, transaction.currency)}</td>
                                      <td className="py-2 px-4 text-sm">
                                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
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
                      
                      <div className={cn(
                        "border rounded-lg p-4",
                        user.verified_account_name ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"
                      )}>
                        <h3 className={cn(
                          "text-base font-semibold mb-2",
                          user.verified_account_name ? "text-blue-800" : "text-amber-800"
                        )}>
                          Payment Account Status
                        </h3>
                        <p className={cn(
                          "text-sm mb-2",
                          user.verified_account_name ? "text-blue-700" : "text-amber-700"
                        )}>
                          {user.verified_account_name 
                            ? `Your account is set up for automatic payments to ${user.verified_account_name}`
                            : "Please set up your bank details above to receive automatic payments"}
                        </p>
                        <p className={cn(
                          "text-xs",
                          user.verified_account_name ? "text-blue-600" : "text-amber-600"
                        )}>
                          {user.verified_account_name
                            ? "Payments for beat sales are automatically split with 90% going to your account"
                            : "Once set up, payments for beat sales will automatically be split with 90% going to your account"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
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
                      <div className="flex items-center justify-center w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : saveSuccess.preferences ? (
                      <div className="flex items-center justify-center w-full">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        <span>Saved</span>
                      </div>
                    ) : (
                      <span>Save Preferences</span>
                    )}
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
