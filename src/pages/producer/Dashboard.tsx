import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart } from "lucide-react";
import { useBeats } from "@/hooks/useBeats";
import { useAuth } from "@/context/AuthContext";
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

const revenueData = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 3000 },
  { name: "Mar", value: 5000 },
  { name: "Apr", value: 2780 },
  { name: "May", value: 1890 },
  { name: "Jun", value: 2390 },
  { name: "Jul", value: 3490 },
  { name: "Aug", value: 4000 },
  { name: "Sep", value: 4500 },
  { name: "Oct", value: 6000 },
  { name: "Nov", value: 7000 },
  { name: "Dec", value: 9000 },
];

const playsData = [
  { name: "Jan", value: 1200 },
  { name: "Feb", value: 1900 },
  { name: "Mar", value: 2500 },
  { name: "Apr", value: 3200 },
  { name: "May", value: 2800 },
  { name: "Jun", value: 3500 },
  { name: "Jul", value: 4200 },
  { name: "Aug", value: 5000 },
  { name: "Sep", value: 5500 },
  { name: "Oct", value: 6200 },
  { name: "Nov", value: 7500 },
  { name: "Dec", value: 8200 },
];

const genreData = [
  { name: "Afrobeat", value: 45 },
  { name: "Amapiano", value: 25 },
  { name: "Hip Hop", value: 15 },
  { name: "R&B", value: 10 },
  { name: "Others", value: 5 },
];

const COLORS = ["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"];

const recentActivity = [
  {
    id: 1,
    type: "sale",
    title: "New Sale: Afrobeat 9ja Mix",
    amount: "₦10,000",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "favorite",
    title: "Lagos Nights added to favorites",
    user: "John D.",
    time: "5 hours ago",
  },
  {
    id: 3,
    type: "comment",
    title: "New comment on Highlife Classics",
    comment: "This beat is fire! Perfect for my next project.",
    user: "Sarah M.",
    time: "1 day ago",
  },
  {
    id: 4,
    type: "royalty",
    title: "Royalty payment received",
    amount: "₦25,500",
    time: "2 days ago",
  },
  {
    id: 5,
    type: "sale",
    title: "New Sale: Amapiano Fusion",
    amount: "₦12,000",
    time: "3 days ago",
  },
];

export default function ProducerDashboard() {
  const { user } = useAuth();
  const { getProducerBeats } = useBeats();
  const producerBeats = user ? getProducerBeats(user.id) : [];

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Producer Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦152,500</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">↑ 12%</span> from last month
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
              <div className="text-2xl font-bold">24,521</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">↑ 18%</span> from last month
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
              <div className="text-2xl font-bold">135</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">↑ 5%</span> from last month
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
              <div className="text-2xl font-bold">286</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">↑ 24%</span> from last month
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
                      <Tooltip />
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
                      <Tooltip />
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
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {activity.type === "sale" && <LineChart size={16} className="text-green-500" />}
                      {activity.type === "favorite" && <Heart size={16} className="text-red-500" />}
                      {activity.type === "comment" && <MessageSquare size={16} className="text-blue-500" />}
                      {activity.type === "royalty" && <DollarSign size={16} className="text-yellow-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      {activity.amount && (
                        <p className="text-sm text-green-500">{activity.amount}</p>
                      )}
                      {activity.comment && (
                        <p className="text-sm text-muted-foreground italic">"{activity.comment}"</p>
                      )}
                      {activity.user && (
                        <p className="text-xs text-muted-foreground">by {activity.user}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
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
                {producerBeats.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    You haven't uploaded any beats yet. Go to Upload Beat to get started.
                  </p>
                ) : (
                  producerBeats.slice(0, 5).map((beat, index) => (
                    <div key={beat.id} className="flex items-center gap-3 pb-4 border-b last:border-0">
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
                          {beat.purchase_count} sales
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
