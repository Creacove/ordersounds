
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminStats {
  totalBeats: number;
  trendingCount: number;
  featuredCount: number;
  weeklyPicksCount: number;
  publishedCount: number;
  currentProducerOfWeek?: {
    id: string;
    name: string;
    stageName?: string;
    profilePicture?: string;
    followerCount: number;
  } | null;
}

export function usePaystackAdmin() {
  const [subaccounts, setSubaccounts] = useState<any[]>([]);
  const [splits, setSplits] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Use React Query for producers with caching
  const { 
    data: producers = [], 
    isLoading: producersLoading, 
    refetch: refetchProducers 
  } = useQuery({
    queryKey: ['admin-producers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, stage_name, paystack_subaccount_code, paystack_split_code, bank_code, account_number, verified_account_name')
        .eq('role', 'producer')
        .limit(50); // Basic pagination
      
      if (error) {
        console.error('Error fetching producers:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
  
  // Fetch subaccounts from Paystack
  const fetchSubaccounts = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for now - replace with real Paystack API call
      const mockSubaccounts = [
        {
          id: '1',
          business_name: 'Producer 1 Music',
          subaccount_code: 'ACCT_abc123',
          settlement_bank: 'GTBank',
          account_number: '0123456789',
          active: true
        },
        {
          id: '2',
          business_name: 'Producer 2 Beats',
          subaccount_code: 'ACCT_def456',
          settlement_bank: 'Access Bank',
          account_number: '9876543210',
          active: true
        }
      ];
      
      setSubaccounts(mockSubaccounts);
    } catch (error) {
      console.error('Error fetching subaccounts:', error);
      toast.error('Failed to fetch subaccounts');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch splits from Paystack
  const fetchSplits = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for now - replace with real Paystack API call
      const mockSplits = [
        {
          id: '1',
          name: 'Producer Split 1',
          split_code: 'SPL_abc123',
          split_type: 'percentage',
          active: true,
          subaccounts: [
            {
              subaccount: 'ACCT_abc123',
              share: 90
            }
          ]
        }
      ];
      
      setSplits(mockSplits);
    } catch (error) {
      console.error('Error fetching splits:', error);
      toast.error('Failed to fetch splits');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch real transactions from database
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real transaction data with optimized query
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          payment_reference,
          total_price,
          status,
          order_date,
          line_items (
            beat_id,
            price_charged,
            beats (
              title,
              producer_id,
              users:producer_id (
                stage_name,
                full_name
              )
            )
          )
        `)
        .eq('status', 'completed')
        .order('order_date', { ascending: false })
        .limit(20); // Pagination
      
      if (ordersError) throw ordersError;
      
      // Transform data for display
      const formattedTransactions = (ordersData || []).flatMap(order => 
        order.line_items.map((item: any) => ({
          id: `${order.id}-${item.beat_id}`,
          reference: order.payment_reference || `ORDER_${order.id}`,
          beat: item.beats?.title || 'Unknown Beat',
          producer: item.beats?.users?.stage_name || item.beats?.users?.full_name || 'Unknown Producer',
          amount: item.price_charged || 0,
          platform_share: (item.price_charged || 0) * 0.1, // 10% platform share
          producer_share: (item.price_charged || 0) * 0.9, // 90% producer share
          status: order.status,
          date: order.order_date
        }))
      );
      
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a producer's bank details
  const updateProducerBankInfo = async (producerId: string, bankCode: string, accountNumber: string) => {
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('users')
        .update({
          bank_code: bankCode,
          account_number: accountNumber
        })
        .eq('id', producerId);
      
      if (error) throw error;
      
      toast.success('Bank details updated successfully');
      refetchProducers(); // Refresh cached data
      return true;
    } catch (error) {
      console.error('Error updating bank details:', error);
      toast.error('Failed to update bank details');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Update a producer's split percentage
  const updateProducerShare = async (producerId: string, percentage: number) => {
    try {
      setIsUpdating(true);
      
      // This would typically call Paystack API to update split percentage
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Producer share updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating producer share:', error);
      toast.error('Failed to update producer share');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Retry a failed transaction
  const retryFailedTransaction = async (transactionId: string) => {
    try {
      setIsUpdating(true);
      
      // Simulate retry operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Transaction retry initiated');
      fetchTransactions(); // Refresh transactions
      return true;
    } catch (error) {
      console.error('Error retrying transaction:', error);
      toast.error('Failed to retry transaction');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };
  
  return {
    subaccounts,
    splits,
    transactions,
    producers,
    isLoading: isLoading || producersLoading,
    isUpdating,
    fetchSubaccounts,
    fetchSplits,
    fetchProducers: refetchProducers,
    fetchTransactions,
    updateProducerBankInfo,
    updateProducerShare,
    retryFailedTransaction
  };
}
