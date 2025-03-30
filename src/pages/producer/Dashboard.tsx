
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart } from "lucide-react";
import { useBeats } from "@/hooks/useBeats";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ProducerBankDetailsForm } from "@/components/payment/ProducerBankDetailsForm";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { getProducerStats, ProducerStats } from "@/lib/producerStats";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"];

export default function ProducerDashboard() {
  const { user, currency } = useAuth();
  const { getProducerBeats } = useBeats();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [producerData, setProducerData] = useState<any>(null);
  const [isLoadingProducer, setIsLoadingProducer] = useState(true);
  const [stats, setStats] = useState<ProducerStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Fetch producer data including bank details and subaccount info
  useEffect(() => {
    const fetchProducerData = async () => {
      if (!user) return;
      
      try {
        setIsLoadingProducer(true);
        const { data, error } = await supabase
          .from('users')
          .select('bank_code, account_number, verified_account_name, paystack_subaccount_code, paystack_split_code')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching producer data:', error);
          return;
        }
        
        setProducerData(data);
        
        // Show bank details form if not set up yet
        if (!data.paystack_subaccount_code || !data.paystack_split_code) {
          setShowBankDetails(true);
        }
      } catch (error) {
        console.error('Error fetching producer data:', error);
      } finally {
        setIsLoadingProducer(false);
      }
    };
    
    fetchProducerData();
  }, [user]);
  
  // Fetch producer analytics data
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        setIsLoadingStats(true);
        const producerStats = await getProducerStats(user.id);
        setStats(producerStats);
      } catch (error) {
        console.error('Error fetching producer stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    fetchStats();
  }, [user]);
  
  const producerBeats = user ? getProducerBeats(user.id) : [];
  
  // Sort beats by purchase count in descending order
  const topSellingBeats = [...producerBeats].sort((a, b) => 
    (b.purchase_count || 0) - (a.purchase_count || 0)
  ).slice(0, 5);
  
  // Get recent notifications for this producer
  const recentNotifications = notifications
    .filter(notification => user && notification.recipient_id === user.id)
    .slice(0, 5);
  
  const handleBeatClick = (beatId: string) => {
    navigate(`/beat/${beatId}`);
  };
  
  const handleNotificationClick = (notification: any) => {
    if (notification.related_entity_id && notification.related_entity_type) {
      switch (notification.related_entity_type) {
        case 'beat':
          navigate(`/beat/${notification.related_entity_id}`);
          break;
        case 'order':
          navigate(`/orders`);
          break;
        case 'message':
          navigate(`/messages`);
          break;
        default:
          // No specific navigation for other types
          break;
      }
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <LineChart size={16} className="text-green-500" />;
      case 'favorite':
        return <Heart size={16} className="text-red-500" />;
      case 'comment':
        return <MessageSquare size={16} className="text-blue-500" />;
      case 'royalty':
      case 'payment':
        return <DollarSign size={16} className="text-yellow-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };
  
  const handleBankDetailsSubmitted = () => {
    setShowBankDetails(false);
    // Refresh producer data
    if (user) {
      supabase
        .from('users')
        .select('bank_code, account_number, verified_account_name, paystack_subaccount_code, paystack_split_code')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error refreshing producer data:', error);
            return;
          }
          setProducerData(data);
        });
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Producer Dashboard</h1>

        {showBankDetails && user && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Set Up Payment Account</CardTitle>
              <CardDescription>
                Enter your bank details to receive automatic payments for your beat sales.
                You will receive 90% of each sale directly to your bank account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProducerBankDetailsForm 
                producerId={user.id}
                existingBankCode={producerData?.bank_code}
                existingAccountNumber={producerData?.account_number}
                existingAccountName={producerData?.verified_account_name}
                onSuccess={handleBankDetailsSubmitted}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? 
                  "Loading..." : 
                  formatCurrency(stats?.totalRevenue || 0, currency)
                }
              </div>
              {!isLoadingStats && stats && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={`${stats.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(stats.revenueChange)}%
                  </span> from last month
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Plays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "Loading..." : (stats?.totalPlays || 0).toLocaleString()}
              </div>
              {!isLoadingStats && stats && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={`${stats.playsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.playsChange >= 0 ? '↑' : '↓'} {Math.abs(stats.playsChange)}%
                  </span> from last month
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Beats Sold
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "Loading..." : (stats?.beatsSold || 0).toLocaleString()}
              </div>
              {!isLoadingStats && stats && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={`${stats.salesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.salesChange >= 0 ? '↑' : '↓'} {Math.abs(stats.salesChange)}%
                  </span> from last month
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New Favorites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "Loading..." : (stats?.totalFavorites || 0).toLocaleString()}
              </div>
              {!isLoadingStats && stats && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={`${stats.favoritesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.favoritesChange >= 0 ? '↑' : '↓'} {Math.abs(stats.favoritesChange)}%
                  </span> from last month
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Track your beat performance metrics</CardDescription>
              <Tabs defaultValue="revenue">
                <TabsList>
                  <TabsTrigger value="revenue" className="gap-1">
                    <LineChart size={14} />
                    <span>Revenue</span>
                  </TabsTrigger>
                  <TabsTrigger value="plays" className="gap-1">
                    <BarChart size={14} />
                    <span>Plays</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="revenue" className="h-80">
                  {isLoadingStats ? (
                    <div className="h-full flex items-center justify-center">Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.revenueByMonth || []}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value), currency), "Revenue"]} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#7C3AED"
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </TabsContent>
                <TabsContent value="plays" className="h-80">
                  {isLoadingStats ? (
                    <div className="h-full flex items-center justify-center">Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={stats?.playsByMonth || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [value, "Plays"]} />
                        <Bar dataKey="value" fill="#7C3AED" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  )}
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Genre Distribution</CardTitle>
              <CardDescription>Sales by genre</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              {isLoadingStats ? (
                <div>Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={stats?.genreDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats?.genreDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest happenings with your beats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentNotifications.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No recent activity to display</p>
                ) : (
                  recentNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className="flex items-start gap-3 pb-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Beats</CardTitle>
              <CardDescription>Your best performers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSellingBeats.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    You haven't uploaded any beats yet. Go to Upload Beat to get started.
                  </p>
                ) : (
                  topSellingBeats.map((beat, index) => (
                    <div 
                      key={beat.id} 
                      className="flex items-center gap-3 pb-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                      onClick={() => handleBeatClick(beat.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                        <img
                          src={beat.cover_image_url}
                          alt={beat.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{beat.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {beat.purchase_count || 0} sales
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          ₦{(beat.basic_license_price_local || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${beat.basic_license_price_diaspora || 0}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

function Bell(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function Heart(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function MessageSquare(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function DollarSign(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
