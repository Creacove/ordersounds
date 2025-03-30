
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, BarChart, LineChart, PieChart } from '@/components/ui/charts';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { 
  DollarSign, 
  Users, 
  Music, 
  BarChart as BarChartIcon, 
  ArrowUpRight,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAdminPlatformAnalytics, getProducerDetailedAnalytics } from '@/utils/payment/paystackSplitUtils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedProducerId, setSelectedProducerId] = useState<string | null>(null);
  const [producerDetails, setProducerDetails] = useState<any>(null);
  const [isLoadingProducer, setIsLoadingProducer] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch platform analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await getAdminPlatformAnalytics();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching admin analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchAnalytics();
    }
  }, [user]);

  // Fetch producer details when selected
  useEffect(() => {
    const fetchProducerDetails = async () => {
      if (!selectedProducerId) return;
      
      setIsLoadingProducer(true);
      try {
        const data = await getProducerDetailedAnalytics(selectedProducerId);
        setProducerDetails(data);
      } catch (error) {
        console.error('Error fetching producer details:', error);
      } finally {
        setIsLoadingProducer(false);
      }
    };

    fetchProducerDetails();
  }, [selectedProducerId]);

  // Handle producer selection
  const handleSelectProducer = (producerId: string) => {
    setSelectedProducerId(producerId);
  };

  // Handle back to overview
  const handleBackToOverview = () => {
    setSelectedProducerId(null);
    setProducerDetails(null);
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-8">Unauthorized. You must be an admin to view this page.</div>;
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-12 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no analytics data
  if (!analyticsData) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-4">Failed to load analytics data. Please try again later.</p>
      </div>
    );
  }

  // If producer details are being viewed
  if (selectedProducerId && producerDetails) {
    return (
      <div className="p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Producer Details</h1>
          <Button variant="outline" onClick={handleBackToOverview}>
            Back to Overview
          </Button>
        </div>

        {/* Producer Profile */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={producerDetails.producer?.profile_picture} alt={producerDetails.producer?.name} />
                <AvatarFallback>{producerDetails.producer?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{producerDetails.producer?.name}</h2>
                <p className="text-muted-foreground">{producerDetails.producer?.email}</p>
                <p className="mt-2">{producerDetails.producer?.bio || 'No bio available'}</p>
                <div className="flex gap-2 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {producerDetails.producer?.country || 'Unknown Location'}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    producerDetails.producer?.has_subaccount 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {producerDetails.producer?.has_subaccount ? 'Payment Account Connected' : 'No Payment Account'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                  <h3 className="text-2xl font-bold">₦{(producerDetails.total_earnings / 100).toLocaleString()}</h3>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                  <h3 className="text-2xl font-bold">{producerDetails.total_sales}</h3>
                </div>
                <ArrowUpRight className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Plays</p>
                  <h3 className="text-2xl font-bold">{producerDetails.total_plays}</h3>
                </div>
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Favorites</p>
                  <h3 className="text-2xl font-bold">{producerDetails.total_favorites}</h3>
                </div>
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts & Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly Earnings */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Earnings</CardTitle>
              <CardDescription>Earnings over the past 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <AreaChart 
                data={producerDetails.monthly_earnings}
                index="month"
                categories={["amount"]}
                colors={["indigo"]}
                valueFormatter={(value) => `₦${(value / 100).toLocaleString()}`}
                showLegend={false}
                height="h-64"
              />
            </CardContent>
          </Card>
          
          {/* Genre Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Genre Distribution</CardTitle>
              <CardDescription>Distribution of beats by genre</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart 
                data={producerDetails.genre_distribution}
                index="genre"
                category="count"
                valueFormatter={(value) => `${value} beats`}
                colors={["indigo", "cyan", "violet", "amber", "rose", "slate"]}
                className="h-64"
              />
            </CardContent>
          </Card>
          
          {/* Sales Trend */}
          {producerDetails.sales_trend?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Number of beats sold over time</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart 
                  data={producerDetails.sales_trend}
                  index="date"
                  categories={["sales"]}
                  colors={["green"]}
                  valueFormatter={(value) => `${value} sales`}
                  showLegend={false}
                  height="h-64"
                />
              </CardContent>
            </Card>
          )}
          
          {/* Top Beats */}
          <Card>
            <CardHeader>
              <CardTitle>Top Beats</CardTitle>
              <CardDescription>Highest performing beats</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Plays</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {producerDetails.top_beats?.map((beat: any) => (
                    <TableRow key={beat.id}>
                      <TableCell className="font-medium">{beat.title}</TableCell>
                      <TableCell>{beat.genre || 'Unknown'}</TableCell>
                      <TableCell>{beat.purchase_count || 0}</TableCell>
                      <TableCell>{beat.plays || 0}</TableCell>
                    </TableRow>
                  ))}
                  {(!producerDetails.top_beats || producerDetails.top_beats.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">No beats found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest sales</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beat</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {producerDetails.recent_transactions?.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.beat_title}</TableCell>
                      <TableCell>₦{(transaction.amount / 100).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === 'successful' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!producerDetails.recent_transactions || producerDetails.recent_transactions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">No recent transactions</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Admin Dashboard View
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold">₦{(analyticsData.revenue.total_revenue / 100).toLocaleString()}</h3>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Producers</p>
                <h3 className="text-2xl font-bold">{analyticsData.users.total_producers}</h3>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Buyers</p>
                <h3 className="text-2xl font-bold">{analyticsData.users.total_buyers}</h3>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Beats</p>
                <h3 className="text-2xl font-bold">{analyticsData.content.total_beats}</h3>
              </div>
              <Music className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="producers">Producers</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue over the past 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <AreaChart 
                  data={analyticsData.revenue.monthly_revenue}
                  index="month"
                  categories={["amount"]}
                  colors={["indigo"]}
                  valueFormatter={(value) => `₦${(value / 100).toLocaleString()}`}
                  showLegend={false}
                  height="h-64"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Platform vs Producer Revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChart 
                  data={[
                    { name: 'Platform Revenue', value: analyticsData.revenue.platform_revenue },
                    { name: 'Producers Revenue', value: analyticsData.revenue.producers_revenue }
                  ]}
                  index="name"
                  category="value"
                  valueFormatter={(value) => `₦${(value / 100).toLocaleString()}`}
                  colors={["indigo", "cyan"]}
                  className="h-64"
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Producers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Producers</CardTitle>
                <CardDescription>By number of sales</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producer</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.top_performers.producers.map((producer: any) => (
                      <TableRow key={producer.id}>
                        <TableCell className="font-medium">{producer.name}</TableCell>
                        <TableCell>{producer.total_purchases}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSelectProducer(producer.id)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Top Beats */}
            <Card>
              <CardHeader>
                <CardTitle>Top Beats</CardTitle>
                <CardDescription>By number of sales</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beat</TableHead>
                      <TableHead>Producer</TableHead>
                      <TableHead>Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.top_performers.beats.map((beat: any) => (
                      <TableRow key={beat.id}>
                        <TableCell className="font-medium">{beat.title}</TableCell>
                        <TableCell>{beat.producer_name}</TableCell>
                        <TableCell>{beat.purchase_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Platform revenue metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <h3 className="text-2xl font-bold">₦{(analyticsData.revenue.total_revenue / 100).toLocaleString()}</h3>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Platform Revenue</p>
                  <h3 className="text-2xl font-bold">₦{(analyticsData.revenue.platform_revenue / 100).toLocaleString()}</h3>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Producers Revenue</p>
                  <h3 className="text-2xl font-bold">₦{(analyticsData.revenue.producers_revenue / 100).toLocaleString()}</h3>
                </div>
              </div>
              
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4">Monthly Revenue Trend</h4>
                <AreaChart 
                  data={analyticsData.revenue.monthly_revenue}
                  index="month"
                  categories={["amount"]}
                  colors={["indigo"]}
                  valueFormatter={(value) => `₦${(value / 100).toLocaleString()}`}
                  showLegend={false}
                  height="h-72"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Producers Tab */}
        <TabsContent value="producers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Producer Management</CardTitle>
              <CardDescription>View and manage producer accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Producer List</h4>
                  <p className="text-sm text-muted-foreground">Total: {analyticsData.users.total_producers}</p>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producer</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Payment Account</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.top_performers.producers.map((producer: any) => (
                      <TableRow key={producer.id}>
                        <TableCell className="font-medium">{producer.name}</TableCell>
                        <TableCell>{producer.total_purchases}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSelectProducer(producer.id)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Overview</CardTitle>
              <CardDescription>Beats and content metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Top Beats</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Beat</TableHead>
                        <TableHead>Producer</TableHead>
                        <TableHead>Sales</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsData.top_performers.beats.map((beat: any) => (
                        <TableRow key={beat.id}>
                          <TableCell className="font-medium">{beat.title}</TableCell>
                          <TableCell>{beat.producer_name}</TableCell>
                          <TableCell>{beat.purchase_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4">Content Stats</h4>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Beats</p>
                      <h3 className="text-2xl font-bold">{analyticsData.content.total_beats}</h3>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Avg. Price</p>
                      <h3 className="text-2xl font-bold">₦2,500</h3>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Avg. Plays per Beat</p>
                      <h3 className="text-2xl font-bold">120</h3>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
