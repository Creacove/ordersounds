
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, Clock, Activity } from "lucide-react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatCurrency } from '@/utils/formatters';

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

interface PaymentStatsSectionProps {
  userId: string;
  hasVerifiedAccount: boolean;
  verifiedAccountName?: string | null;
}

export function PaymentStatsSection({ userId, hasVerifiedAccount, verifiedAccountName }: PaymentStatsSectionProps) {
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentAnalytics();
  }, [userId]);

  const fetchPaymentAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      
      // Get producer's beats
      const { data: producerBeats, error: beatsError } = await supabase
        .from('beats')
        .select('id')
        .eq('producer_id', userId);
        
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
        .eq('producer_id', userId)
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

  return (
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
              hasVerifiedAccount ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"
            )}>
              <h3 className={cn(
                "text-base font-semibold mb-2",
                hasVerifiedAccount ? "text-blue-800" : "text-amber-800"
              )}>
                Payment Account Status
              </h3>
              <p className={cn(
                "text-sm mb-2",
                hasVerifiedAccount ? "text-blue-700" : "text-amber-700"
              )}>
                {hasVerifiedAccount 
                  ? `Your account is set up for automatic payments to ${verifiedAccountName}`
                  : "Please set up your bank details above to receive automatic payments"}
              </p>
              <p className={cn(
                "text-xs",
                hasVerifiedAccount ? "text-blue-600" : "text-amber-600"
              )}>
                {hasVerifiedAccount
                  ? "Payments for beat sales are automatically split with 90% going to your account"
                  : "Once set up, payments for beat sales will automatically be split with 90% going to your account"}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {hasVerifiedAccount 
                ? "No payment data available yet. Start selling beats to see your earnings!"
                : "Please set up your bank details above to start receiving payments"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
