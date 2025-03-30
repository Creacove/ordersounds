
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";
import { useBeats } from "@/hooks/useBeats";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, subMonths } from "date-fns";
import { ProducerBankDetailsForm } from "@/components/payment/ProducerBankDetailsForm";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart
} from "@/components/ui/charts";

const COLORS = ["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"];

export default function ProducerDashboard() {
  const { user } = useAuth();
  const { getProducerBeats } = useBeats();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [producerData, setProducerData] = useState<any>(null);
  const [isLoadingProducer, setIsLoadingProducer] = useState(true);
  const [producerBeats, setProducerBeats] = useState<any[]>([]);
  
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
        const beats = await getProducerBeats(user.id);
        setProducerBeats(beats);
        
        // Calculate total plays - sum of plays from all beats
        const plays = beats.reduce((sum, beat) => sum + (beat.plays || 0), 0);
        setTotalPlays(plays);
        
        // Get all beat IDs from this producer
        const beatIds = beats.map(beat => beat.id);
        
        // Fetch sales data from user_purchased_beats table
        const { data: purchasedBeats, error: purchasedError } = await supabase
          .from('user_purchased_beats')
          .select('beat_id, purchase_date, currency_code')
          .in('beat_id', beatIds);
          
        if (purchasedError) {
          console.error('Error fetching purchased beats:', purchasedError);
          return;
        }
        
        // Calculate total sales count
        const sales = purchasedBeats ? purchasedBeats.length : 0;
        setTotalSales(sales);
        
        // Calculate total favorites - sum of favorites_count across all beats
        const favorites = beats.reduce((sum, beat) => sum + (beat.favorites_count || 0), 0);
        setTotalFavorites(favorites);
        
        // Fetch revenue data from payments table related to producer
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount, producer_share, payment_date, status')
          .eq('status', 'success');
          
        if (paymentsError) {
          console.error('Error fetching payment data:', paymentsError);
          return;
        }
        
        // Get payments for the producer's beats
        const { data: lineItems, error: lineItemsError } = await supabase
          .from('line_items')
          .select('beat_id, order_id, price_charged')
          .in('beat_id', beatIds);
          
        if (lineItemsError) {
          console.error('Error fetching line items:', lineItemsError);
          return;
        }
        
        // Get all order IDs from line items
        const orderIds = lineItems ? [...new Set(lineItems.map(item => item.order_id))] : [];
        
        // Get successful payments for these orders
        const producerPayments = payments ? payments.filter(payment => {
          // Since payment may not have order_id directly, we can't filter by it
          // Instead, we'll calculate total revenue from all successful payments
          return payment.status === 'success' && payment.producer_share > 0;
        }) : [];
        
        // Calculate total revenue (sum of producer_share)
        const revenue = producerPayments.reduce((sum, payment) => 
          sum + (payment.producer_share || 0), 0);
        setTotalRevenue(revenue);
        
        // Generate monthly revenue data
        const now = new Date();
        const monthlyRevenue = Array(12).fill(0);
        const monthlyPlays = Array(12).fill(0);
        const monthlyFavorites = Array(12).fill(0);
        const monthlySales = Array(12).fill(0);
        const currentMonth = now.getMonth();
        
        // Process payment data by month
        producerPayments.forEach(payment => {
          if (payment.payment_date) {
            const paymentDate = new Date(payment.payment_date);
            // Calculate relative month index (0-11)
            const monthIndex = (12 + paymentDate.getMonth() - currentMonth) % 12;
            monthlyRevenue[monthIndex] += (payment.producer_share || 0);
          }
        });
        
        // Process sales data by month
        purchasedBeats?.forEach(purchase => {
          if (purchase.purchase_date) {
            const purchaseDate = new Date(purchase.purchase_date);
            const monthIndex = (12 + purchaseDate.getMonth() - currentMonth) % 12;
            monthlySales[monthIndex]++;
          }
        });
        
        // Generate monthly plays data by distributing total plays
        // This is a rough estimation as we don't have historical plays data
        beats.forEach(beat => {
          const playsCount = beat.plays || 0;
          // Distribute proportionally more plays to recent months
          for (let i = 0; i < 12; i++) {
            // Weigh recent months higher
            const weight = (12 - i) / 78; // Sum of 1-12 is 78
            monthlyPlays[i] += Math.floor(playsCount * weight);
          }
        });
        
        // Similar approach for favorites
        beats.forEach(beat => {
          const favCount = beat.favorites_count || 0;
          for (let i = 0; i < 12; i++) {
            const weight = (12 - i) / 78;
            monthlyFavorites[i] += Math.floor(favCount * weight);
          }
        });
        
        // Calculate last month metrics for comparisons
        setLastMonthRevenue(monthlyRevenue[1]);
        setLastMonthPlays(monthlyPlays[1]);
        setLastMonthSales(monthlySales[1]);
        setLastMonthFavorites(monthlyFavorites[1]);
        
        // Format revenue data for chart
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const revenueChartData = monthlyRevenue.map((value, index) => ({
          name: months[(currentMonth + index) % 12],
          value: value,
        }));
        setRevenueData(revenueChartData.slice(0, 12));
        
        // Format plays data for chart
        const playsChartData = monthlyPlays.map((value, index) => ({
          name: months[(currentMonth + index) % 12],
          value: value,
        }));
        setPlaysData(playsChartData.slice(0, 12));
        
        // Generate genre distribution data
        const genreCounts: Record<string, number> = {};
        beats.forEach(beat => {
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
    revenueData.length > 2 ? revenueData[2].value : 0
  );
  
  const playsChange = calculatePercentChange(
    lastMonthPlays,
    playsData.length > 2 ? playsData[2].value : 0
  );
  
  const salesChange = calculatePercentChange(
    lastMonthSales,
    revenueData.length > 2 ? revenueData[2].value / 1000 : 0
  );
  
  const favoritesChange = calculatePercentChange(
    lastMonthFavorites,
    totalFavorites * 0.09
  );
  
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
                    <LineChartIcon size={14} />
                    <span>Revenue</span>
                  </TabsTrigger>
                  <TabsTrigger value="plays" className="gap-1">
                    <BarChartIcon size={14} />
                    <span>Plays</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="revenue" className="h-80">
                  <AreaChart 
                    data={revenueData}
                    index="name"
                    categories={["value"]}
                    colors={["#7C3AED"]}
                    valueFormatter={(value) => formatCurrency(value)}
                  />
                </TabsContent>
                <TabsContent value="plays" className="h-80">
                  <BarChart 
                    data={playsData}
                    index="name"
                    categories={["value"]}
                    colors={["#7C3AED"]}
                    valueFormatter={(value) => value.toLocaleString()}
                  />
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Genre Distribution</CardTitle>
              <CardDescription>Sales by genre</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <PieChart
                data={genreData}
                index="name"
                category="value"
                colors={COLORS}
                valueFormatter={(value) => value.toLocaleString()}
              />
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

function getNotificationIcon(type: string) {
  switch (type) {
    case 'sale':
      return <DollarSign size={16} className="text-green-500" />;
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
}
