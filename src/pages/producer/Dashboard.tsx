
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart } from "lucide-react";
import { useBeats } from "@/hooks/useBeats";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, subMonths } from "date-fns";
import { ProducerBankDetailsForm } from "@/components/payment/ProducerBankDetailsForm";
import { supabase } from "@/integrations/supabase/client";
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
  const { user } = useAuth();
  const { getProducerBeats } = useBeats();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [producerData, setProducerData] = useState<any>(null);
  const [isLoadingProducer, setIsLoadingProducer] = useState(true);
  
  // Analytics states
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPlays, setTotalPlays] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalFavorites, setTotalFavorites] = useState(0);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [playsData, setPlaysData] = useState<any[]>([]);
  const [genreData, setGenreData] = useState<any[]>([]);
  const [lastMonthRevenue, setLastMonthRevenue] = useState(0);
  const [lastMonthPlays, setLastMonthPlays] = useState(0);
  const [lastMonthSales, setLastMonthSales] = useState(0);
  const [lastMonthFavorites, setLastMonthFavorites] = useState(0);
  
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
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;
      
      try {
        // Fetch all producer beats
        const producerBeats = await getProducerBeats(user.id);
        
        // Calculate total plays
        const plays = producerBeats.reduce((sum, beat) => sum + (beat.plays || 0), 0);
        setTotalPlays(plays);
        
        // Calculate total sales
        const sales = producerBeats.reduce((sum, beat) => sum + (beat.purchase_count || 0), 0);
        setTotalSales(sales);
        
        // Calculate total favorites
        const favorites = producerBeats.reduce((sum, beat) => sum + (beat.favorites_count || 0), 0);
        setTotalFavorites(favorites);
        
        // Fetch revenue data from payments
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('amount, producer_share, payment_date')
          .eq('status', 'success')
          .gte('payment_date', oneYearAgo.toISOString())
          .order('payment_date', { ascending: true });
          
        if (paymentError) {
          console.error('Error fetching payment data:', paymentError);
          return;
        }
        
        // Calculate total revenue
        const revenue = (paymentData || []).reduce((sum, payment) => 
          sum + (payment.producer_share || 0), 0);
        setTotalRevenue(revenue);
        
        // Calculate monthly revenue data
        const monthlyRevenue = Array(12).fill(0);
        const monthlyPlays = Array(12).fill(0);
        const currentMonth = now.getMonth();
        
        (paymentData || []).forEach(payment => {
          const paymentDate = new Date(payment.payment_date);
          const monthIndex = (paymentDate.getMonth() - currentMonth + 12) % 12;
          monthlyRevenue[monthIndex] += (payment.producer_share || 0);
        });
        
        // Generate monthly plays data (mock data for now, can be replaced with real data)
        producerBeats.forEach(beat => {
          // For this example, we'll distribute plays randomly over the months
          // In a real app, you'd fetch play history from the database
          const playsCount = beat.plays || 0;
          const playsPerMonth = Math.floor(playsCount / 12);
          
          for (let i = 0; i < 12; i++) {
            // Add a random variation to make the data look more realistic
            const randomFactor = Math.random() * 0.5 + 0.75; // 0.75 to 1.25
            monthlyPlays[i] += Math.floor(playsPerMonth * randomFactor);
          }
        });
        
        // Calculate last month revenue and percentage change
        const lastMonthIndex = (currentMonth - 1 + 12) % 12;
        const twoMonthsAgoIndex = (currentMonth - 2 + 12) % 12;
        
        setLastMonthRevenue(monthlyRevenue[lastMonthIndex]);
        setLastMonthPlays(monthlyPlays[lastMonthIndex]);
        
        // Calculate last month sales and favorites (mock data for now)
        const lastMonthSalesCount = Math.floor(sales * 0.15); // Assuming 15% of total sales were last month
        const twoMonthsAgoSalesCount = Math.floor(sales * 0.1); // Assuming 10% were two months ago
        setLastMonthSales(lastMonthSalesCount);
        
        const lastMonthFavoritesCount = Math.floor(favorites * 0.2); // Assuming 20% of favorites were last month
        const twoMonthsAgoFavoritesCount = Math.floor(favorites * 0.15); // Assuming 15% were two months ago
        setLastMonthFavorites(lastMonthFavoritesCount);
        
        // Format revenue data for chart
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const revenueChartData = monthlyRevenue.map((value, index) => ({
          name: months[(currentMonth + index) % 12],
          value: value,
        }));
        setRevenueData(revenueChartData);
        
        // Format plays data for chart
        const playsChartData = monthlyPlays.map((value, index) => ({
          name: months[(currentMonth + index) % 12],
          value: value,
        }));
        setPlaysData(playsChartData);
        
        // Generate genre distribution data
        const genreCounts: Record<string, number> = {};
        producerBeats.forEach(beat => {
          if (beat.genre) {
            genreCounts[beat.genre] = (genreCounts[beat.genre] || 0) + (beat.purchase_count || 1);
          }
        });
        
        const genreDistribution = Object.entries(genreCounts).map(([name, value]) => ({
          name,
          value,
        })).sort((a, b) => b.value - a.value);
        
        // Take top 4 genres and group the rest as "Others"
        if (genreDistribution.length > 4) {
          const topGenres = genreDistribution.slice(0, 4);
          const otherGenres = genreDistribution.slice(4);
          const othersValue = otherGenres.reduce((sum, genre) => sum + genre.value, 0);
          
          if (othersValue > 0) {
            topGenres.push({ name: 'Others', value: othersValue });
          }
          
          setGenreData(topGenres);
        } else {
          setGenreData(genreDistribution);
        }
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
    };
    
    fetchAnalyticsData();
  }, [user, getProducerBeats]);
  
  // Get producer beats and sort by purchase count
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
  
  // Calculate percentage changes for analytics cards
  const calculatePercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round((current - previous) / previous * 100);
  };
  
  const revenueChange = calculatePercentChange(
    lastMonthRevenue, 
    monthlyRevenue(2)
  );
  
  const playsChange = calculatePercentChange(
    lastMonthPlays,
    monthlyPlays(2)
  );
  
  const salesChange = calculatePercentChange(
    lastMonthSales,
    monthlyRevenue(2, true)
  );
  
  const favoritesChange = calculatePercentChange(
    lastMonthFavorites,
    monthlyFavorites(2)
  );
  
  // Helper function to get data from X months ago
  function monthlyRevenue(monthsAgo: number, isSales = false) {
    if (revenueData.length === 0) return 0;
    const currentMonth = new Date().getMonth();
    const targetMonthIndex = (currentMonth - monthsAgo + 12) % 12;
    const targetMonthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][targetMonthIndex];
    
    const targetMonthData = revenueData.find(d => d.name === targetMonthName);
    return targetMonthData ? (isSales ? Math.floor(targetMonthData.value / 1000) : targetMonthData.value) : 0;
  }
  
  function monthlyPlays(monthsAgo: number) {
    if (playsData.length === 0) return 0;
    const currentMonth = new Date().getMonth();
    const targetMonthIndex = (currentMonth - monthsAgo + 12) % 12;
    const targetMonthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][targetMonthIndex];
    
    const targetMonthData = playsData.find(d => d.name === targetMonthName);
    return targetMonthData ? targetMonthData.value : 0;
  }
  
  function monthlyFavorites(monthsAgo: number) {
    // Mock data - in a real app you would fetch this from the database
    return Math.floor(totalFavorites * (0.15 - (monthsAgo * 0.03)));
  }
  
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

  // Format currency based on user's default currency
  const formatCurrency = (amount: number) => {
    const currency = user?.default_currency === 'USD' ? '$' : '₦';
    return `${currency}${amount.toLocaleString()}`;
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
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={revenueChange >= 0 ? "text-green-500" : "text-red-500"}>
                  {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange)}%
                </span> from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Plays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPlays.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={playsChange >= 0 ? "text-green-500" : "text-red-500"}>
                  {playsChange >= 0 ? '↑' : '↓'} {Math.abs(playsChange)}%
                </span> from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Beats Sold
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={salesChange >= 0 ? "text-green-500" : "text-red-500"}>
                  {salesChange >= 0 ? '↑' : '↓'} {Math.abs(salesChange)}%
                </span> from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New Favorites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFavorites.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={favoritesChange >= 0 ? "text-green-500" : "text-red-500"}>
                  {favoritesChange >= 0 ? '↑' : '↓'} {Math.abs(favoritesChange)}%
                </span> from last month
              </p>
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
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip formatter={(value) => [`${formatCurrency(Number(value))}`, 'Revenue']} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#7C3AED"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="plays" className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={playsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}`, 'Plays']} />
                      <Bar dataKey="value" fill="#7C3AED" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
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
                          {formatCurrency((beat.basic_license_price_local || 0))}
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
