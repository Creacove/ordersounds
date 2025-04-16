
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useBeats } from "@/hooks/useBeats";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProducerStats } from "@/lib/producerStats";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

// Import refactored components
import { StatsCards } from "@/components/producer/dashboard/StatsCards";
import { AnalyticsCharts } from "@/components/producer/dashboard/AnalyticsCharts";
import { GenreDistribution } from "@/components/producer/dashboard/GenreDistribution";
import { RecentActivity } from "@/components/producer/dashboard/RecentActivity";
import { TopSellingBeats } from "@/components/producer/dashboard/TopSellingBeats";
import { BankDetailsCard } from "@/components/producer/dashboard/BankDetailsCard";

export default function ProducerDashboard() {
  const { user, currency, forceUserDataRefresh } = useAuth();
  const { getProducerBeats, forceRefreshBeats, isLoading, loadingError } = useBeats();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [producerData, setProducerData] = useState<any>(null);
  const [isLoadingProducer, setIsLoadingProducer] = useState(true);
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userLoadError, setUserLoadError] = useState<string | null>(null);

  // Fetch producer data including bank details and subaccount info
  useEffect(() => {
    const fetchProducerData = async () => {
      if (!user) return;

      try {
        setIsLoadingProducer(true);
        setUserLoadError(null);
        
        const { data, error } = await supabase
          .from("users")
          .select(
            "bank_code, account_number, verified_account_name, paystack_subaccount_code, paystack_split_code"
          )
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching producer data:", error);
          setUserLoadError("Could not load your producer profile. Please refresh.");
          return;
        }

        setProducerData(data);

        // Show bank details form if not set up yet
        if (!data.paystack_subaccount_code || !data.paystack_split_code) {
          setShowBankDetails(true);
        }
      } catch (error) {
        console.error("Error fetching producer data:", error);
        setUserLoadError("An unexpected error occurred while loading your producer profile.");
      } finally {
        setIsLoadingProducer(false);
      }
    };

    fetchProducerData();
  }, [user, refreshTrigger]);

  // Fetch producer analytics data
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        setIsLoadingStats(true);
        const producerStats = await getProducerStats(user.id);
        setStats(producerStats);
      } catch (error) {
        console.error("Error fetching producer stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user, refreshTrigger]);

  // Get producer beats and refresh data periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 60000); // Refresh data every minute

    return () => clearInterval(intervalId);
  }, []);

  const producerBeats = user ? getProducerBeats(user.id) : [];

  // Sort beats by purchase count in descending order
  const topSellingBeats = [...producerBeats]
    .sort((a, b) => (b.purchase_count || 0) - (a.purchase_count || 0))
    .slice(0, 5);

  // Get recent notifications for this producer
  const recentNotifications = notifications
    .filter((notification) => user && notification.recipient_id === user.id)
    .slice(0, 5);

  const handleBankDetailsSubmitted = () => {
    setShowBankDetails(false);
    // Refresh producer data
    setRefreshTrigger((prev) => prev + 1);
  };
  
  const handleRefreshData = async () => {
    toast.loading("Refreshing data...");
    
    // Refresh user data first
    if (user) {
      const success = await forceUserDataRefresh();
      if (!success) {
        toast.error("Failed to refresh user data. Please try again.");
      }
    }
    
    // Then refresh beats
    forceRefreshBeats();
    
    // Finally refresh everything else
    setRefreshTrigger(prev => prev + 1);
    
    toast.dismiss();
    toast.success("Data refreshed successfully!");
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Producer Dashboard</h1>
          <Button onClick={handleRefreshData} className="gap-2" variant="outline">
            <RefreshCw className="h-4 w-4" /> Refresh Data
          </Button>
        </div>

        {userLoadError && (
          <Alert variant="warning" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>User Data Error</AlertTitle>
            <AlertDescription>
              {userLoadError}
              <div className="mt-2">
                <Button size="sm" onClick={handleRefreshData} variant="outline" className="gap-2">
                  <RefreshCw className="h-3 w-3" /> Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {loadingError && (
          <Alert variant="warning" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Beats Loading Error</AlertTitle>
            <AlertDescription>
              {loadingError}
              <div className="mt-2">
                <Button size="sm" onClick={forceRefreshBeats} variant="outline" className="gap-2">
                  <RefreshCw className="h-3 w-3" /> Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isLoadingProducer ? (
          <div className="text-center">Loading bank details...</div>
        ) : (
          showBankDetails &&
          user && (
            <BankDetailsCard
              userId={user.id}
              producerData={producerData}
              onSuccess={handleBankDetailsSubmitted}
            />
          )
        )}

        <StatsCards
          stats={stats}
          isLoadingStats={isLoadingStats}
          currency={currency}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <AnalyticsCharts
            stats={stats}
            isLoadingStats={isLoadingStats}
            currency={currency}
          />
          <GenreDistribution stats={stats} isLoadingStats={isLoadingStats} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecentActivity notifications={recentNotifications} />
          <TopSellingBeats beats={topSellingBeats} />
        </div>
      </div>
    </MainLayout>
  );
}
