
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  adminFetchAllSubaccounts,
  adminFetchAllSplits,
  updateProducerBankDetails,
  updateProducerSplitPercentage
} from '@/utils/payment/paystackSplitUtils';
import { supabase } from '@/integrations/supabase/client';

export function usePaystackAdmin() {
  const { user } = useAuth();
  const [subaccounts, setSubaccounts] = useState<any[]>([]);
  const [splits, setSplits] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [producers, setProducers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Fetch subaccounts from Paystack
  const fetchSubaccounts = async () => {
    try {
      setIsLoading(true);
      const data = await adminFetchAllSubaccounts();
      setSubaccounts(data);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch splits from Paystack
  const fetchSplits = async () => {
    try {
      setIsLoading(true);
      const data = await adminFetchAllSplits();
      setSplits(data);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch producers from the database
  const fetchProducers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, producer_name, paystack_subaccount_code, paystack_split_code, bank_code, account_number, verified_account_name')
        .eq('role', 'producer');
      
      if (error) {
        console.error('Error fetching producers:', error);
        return;
      }
      
      setProducers(data || []);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch transactions with splits
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      
      // This would normally fetch transaction data from Paystack or your database
      // For now, we'll use mock data
      const mockTransactions = [
        {
          id: 'tr_1',
          reference: 'ref_12345',
          beat: 'Summer Vibes',
          producer: 'DJ Producer X',
          amount: 10000,
          platform_share: 1000,
          producer_share: 9000,
          paystack_fees: 150,
          status: 'success',
          date: '2025-03-30T12:00:00Z'
        },
        {
          id: 'tr_2',
          reference: 'ref_67890',
          beat: 'Chill Beats',
          producer: 'Beat Maker Y',
          amount: 15000,
          platform_share: 1500,
          producer_share: 13500,
          paystack_fees: 225,
          status: 'success',
          date: '2025-03-29T10:30:00Z'
        },
        {
          id: 'tr_3',
          reference: 'ref_11223',
          beat: 'Night Groove',
          producer: 'Producer Z',
          amount: 8000,
          platform_share: 800,
          producer_share: 7200,
          paystack_fees: 120,
          status: 'failed',
          date: '2025-03-28T09:15:00Z'
        }
      ];
      
      setTransactions(mockTransactions);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a producer's bank details
  const updateProducerBankInfo = async (producerId: string, bankCode: string, accountNumber: string) => {
    try {
      setIsUpdating(true);
      
      const success = await updateProducerBankDetails(producerId, {
        bank_code: bankCode,
        account_number: accountNumber
      });
      
      if (success) {
        // Refresh producers list
        await fetchProducers();
      }
      
      return success;
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Update a producer's split percentage
  const updateProducerShare = async (producerId: string, percentage: number) => {
    try {
      setIsUpdating(true);
      
      const success = await updateProducerSplitPercentage(producerId, percentage);
      
      if (success) {
        // Refresh splits list
        await fetchSplits();
      }
      
      return success;
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Retry a failed transaction
  const retryFailedTransaction = async (transactionId: string) => {
    try {
      setIsUpdating(true);
      
      // In a real implementation, this would call your backend to retry the transaction
      console.log('Retrying transaction:', transactionId);
      
      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh transactions list
      await fetchTransactions();
      
      return true;
    } catch (error) {
      console.error('Error retrying transaction:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      // Initial data fetch
      fetchProducers();
    }
  }, [user]);
  
  return {
    subaccounts,
    splits,
    transactions,
    producers,
    isLoading,
    isUpdating,
    fetchSubaccounts,
    fetchSplits,
    fetchProducers,
    fetchTransactions,
    updateProducerBankInfo,
    updateProducerShare,
    retryFailedTransaction
  };
}
