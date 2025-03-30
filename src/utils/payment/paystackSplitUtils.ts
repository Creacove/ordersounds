
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Type definitions
export interface ProducerBankDetails {
  bank_code: string;
  account_number: string;
  account_name?: string;
}

export interface SubaccountResponse {
  subaccount_code: string;
  split_code: string;
  account_name: string;
  bank_name: string;
}

// Mock bank data for development and testing
const mockBanks = [
  { name: "Access Bank", code: "044", active: true },
  { name: "Zenith Bank", code: "057", active: true },
  { name: "First Bank of Nigeria", code: "011", active: true },
  { name: "Guaranty Trust Bank", code: "058", active: true },
  { name: "United Bank for Africa", code: "033", active: true },
  { name: "Wema Bank", code: "035", active: true },
  { name: "Fidelity Bank", code: "070", active: true },
  { name: "EcoBank", code: "050", active: true },
  { name: "Stanbic IBTC Bank", code: "221", active: true },
  { name: "Sterling Bank", code: "232", active: true },
  { name: "Unity Bank", code: "215", active: true },
  { name: "Union Bank", code: "032", active: true },
  { name: "Keystone Bank", code: "082", active: true },
  { name: "Polaris Bank", code: "076", active: true },
  { name: "FCMB", code: "214", active: true },
  { name: "Citibank Nigeria", code: "023", active: true },
  { name: "Heritage Bank", code: "030", active: true },
  { name: "Providus Bank", code: "101", active: true },
  { name: "Titan Trust Bank", code: "102", active: true },
  { name: "Globus Bank", code: "103", active: true },
  { name: "Premium Trust Bank", code: "105", active: true },
  { name: "Optimus Bank", code: "107", active: false },
];

/**
 * Creates a subaccount and transaction split for a producer
 */
export const createProducerSubaccount = async (producerId: string): Promise<SubaccountResponse | null> => {
  try {
    // In production, this would call the Paystack API via Edge Function
    // For development, we'll simulate a successful response
    console.log('Creating producer subaccount for producer:', producerId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('bank_code, account_number, verified_account_name')
      .eq('id', producerId)
      .single();
      
    if (userError || !userData.bank_code || !userData.account_number) {
      console.error('Error retrieving user bank details:', userError || 'Missing bank details');
      toast.error('Missing bank details. Please update your bank information first.');
      return null;
    }
    
    // Get bank name for display
    const bankName = mockBanks.find(bank => bank.code === userData.bank_code)?.name || 'Unknown Bank';
    
    // Mock response
    const response: SubaccountResponse = {
      subaccount_code: `SUBACCT_${Date.now().toString().slice(-8)}`,
      split_code: `SPLIT_${Date.now().toString().slice(-8)}`,
      account_name: userData.verified_account_name || 'Account Holder',
      bank_name: bankName
    };
    
    // Update user record with subaccount and split codes
    const { error } = await supabase
      .from('users')
      .update({
        paystack_subaccount_code: response.subaccount_code,
        paystack_split_code: response.split_code
      })
      .eq('id', producerId);
      
    if (error) {
      console.error('Error updating subaccount codes:', error);
      toast.error('Error saving subaccount information');
      return null;
    }
    
    console.log('Subaccount created successfully:', response);
    toast.success('Payment account created successfully');
    
    return response;
  } catch (error) {
    console.error('Error creating producer subaccount:', error);
    toast.error('Failed to create payment account');
    return null;
  }
};

/**
 * Updates a producer's subaccount bank details
 */
export const updateProducerBankDetails = async (
  producerId: string, 
  bankDetails: ProducerBankDetails
): Promise<boolean> => {
  try {
    console.log('Updating producer bank details:', {producerId, bankDetails});
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if subaccount exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('paystack_subaccount_code')
      .eq('id', producerId)
      .single();
      
    if (!userError && userData.paystack_subaccount_code) {
      // Update existing subaccount
      console.log('Updating existing subaccount:', userData.paystack_subaccount_code);
    } else {
      // Create new subaccount
      console.log('Creating new subaccount for producer:', producerId);
      const subaccountResult = await createProducerSubaccount(producerId);
      if (!subaccountResult) {
        console.error('Failed to create subaccount');
        return false;
      }
    }
    
    console.log('Bank details updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating producer bank details:', error);
    toast.error('Failed to update bank details');
    return false;
  }
};

/**
 * Updates a producer's transaction split percentage
 */
export const updateProducerSplitPercentage = async (
  producerId: string, 
  sharePercentage: number
): Promise<boolean> => {
  try {
    if (sharePercentage < 0 || sharePercentage > 100) {
      toast.error('Share percentage must be between 0 and 100');
      return false;
    }
    
    console.log('Updating split percentage:', {producerId, sharePercentage});
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update split share in the database
    // This would be handled by your Edge Function in production
    console.log('Split percentage updated successfully');
    toast.success('Split percentage updated successfully');
    
    return true;
  } catch (error) {
    console.error('Error updating split percentage:', error);
    toast.error('Failed to update split percentage');
    return false;
  }
};

/**
 * Fetches the list of supported banks from Paystack
 */
export const fetchSupportedBanks = async (): Promise<any[]> => {
  try {
    // In production, this would call the Paystack API via your Edge Function
    // For development, we'll use mock data
    console.log('Fetching supported banks');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return mock bank data
    return mockBanks;
  } catch (error) {
    console.error('Error fetching banks:', error);
    return [];
  }
};

/**
 * Gets the split code for a specific producer
 */
export const getProducerSplitCode = async (producerId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('paystack_split_code')
      .eq('id', producerId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching split code:', error);
      return null;
    }
    
    return data.paystack_split_code;
  } catch (error) {
    console.error('Error fetching split code:', error);
    return null;
  }
};

/**
 * Resolves the bank account number to verify it exists and get account name
 */
export const resolveAccountNumber = async (
  accountNumber: string, 
  bankCode: string
): Promise<string | null> => {
  try {
    // This would normally be handled by your backend
    // For demo purposes, we're simulating the response
    console.log('Resolving account number:', {accountNumber, bankCode});
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success for valid account numbers
    if (accountNumber.length === 10) {
      // Generate a fake name based on bank code and account number
      const bankName = mockBanks.find(bank => bank.code === bankCode)?.name || 'Unknown';
      const lastFour = accountNumber.slice(-4);
      return `${bankName} Account ${lastFour}`;
    }
    
    // Simulate error for invalid account numbers
    return null;
  } catch (error) {
    console.error('Error resolving account number:', error);
    return null;
  }
};

/**
 * Initializes a transaction with split payment
 */
export const initializePaystackSplitTransaction = async (
  email: string,
  amount: number,
  splitCode: string,
  reference: string
): Promise<{ authorization_url: string; reference: string } | null> => {
  try {
    // This would be handled by your backend, calling Paystack API
    // For demo purposes, we'll simulate the response
    console.log('Initializing transaction with split:', {
      email,
      amount,
      splitCode,
      reference
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a simulated response
    return {
      authorization_url: `https://checkout.paystack.com/demo-split-payment?reference=${reference}`,
      reference: reference
    };
  } catch (error) {
    console.error('Error initializing transaction:', error);
    return null;
  }
};

/**
 * For admin: Fetch all subaccounts
 */
export const adminFetchAllSubaccounts = async (): Promise<any[]> => {
  try {
    // This would call your Edge Function in production
    console.log('Fetching all subaccounts');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Query all producers with subaccount codes
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, stage_name, email, paystack_subaccount_code, bank_code, account_number, verified_account_name')
      .eq('role', 'producer')
      .not('paystack_subaccount_code', 'is', null);
      
    if (error) {
      console.error('Error fetching producers with subaccounts:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Map to a more friendly format for the admin
    return data.map(producer => ({
      id: producer.id,
      producer_name: producer.stage_name || producer.full_name,
      email: producer.email,
      subaccount_code: producer.paystack_subaccount_code,
      bank_details: {
        bank_name: mockBanks.find(bank => bank.code === producer.bank_code)?.name || 'Unknown Bank',
        account_number: producer.account_number,
        account_name: producer.verified_account_name
      }
    }));
  } catch (error) {
    console.error('Error fetching subaccounts:', error);
    return [];
  }
};

/**
 * For admin: Fetch all transaction splits
 */
export const adminFetchAllSplits = async (): Promise<any[]> => {
  try {
    // This would call your Edge Function in production
    console.log('Fetching all splits');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Query all producers with split codes
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, stage_name, email, paystack_split_code')
      .eq('role', 'producer')
      .not('paystack_split_code', 'is', null);
      
    if (error) {
      console.error('Error fetching producers with splits:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Map to a more friendly format for the admin
    return data.map(producer => ({
      id: producer.id,
      producer_name: producer.stage_name || producer.full_name,
      email: producer.email,
      split_code: producer.paystack_split_code,
      share_percentage: 90, // Default is 90% for producer, 10% for platform
    }));
  } catch (error) {
    console.error('Error fetching splits:', error);
    return [];
  }
};

/**
 * Get producer payment analytics
 */
export const getProducerPaymentAnalytics = async (producerId: string): Promise<any> => {
  try {
    console.log('Fetching payment analytics for producer:', producerId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a production environment, this would query your database
    // For now, we'll return mock data
    
    return {
      total_earnings: 125000, // in smallest currency unit (kobo/cents)
      pending_balance: 15000,
      successful_payments: 12,
      pending_payments: 2,
      failed_payments: 1,
      recent_transactions: [
        {
          id: 'trx_1',
          amount: 25000,
          status: 'successful',
          date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
          beat_title: 'Summer Vibes',
          buyer_name: 'John D.'
        },
        {
          id: 'trx_2',
          amount: 15000,
          status: 'successful',
          date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
          beat_title: 'Midnight Dream',
          buyer_name: 'Sarah M.'
        },
        {
          id: 'trx_3',
          amount: 30000,
          status: 'pending',
          date: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
          beat_title: 'Urban Flow',
          buyer_name: 'Alex T.'
        }
      ],
      monthly_earnings: [
        { month: 'Jan', amount: 0 },
        { month: 'Feb', amount: 0 },
        { month: 'Mar', amount: 5000 },
        { month: 'Apr', amount: 15000 },
        { month: 'May', amount: 35000 },
        { month: 'Jun', amount: 25000 },
        { month: 'Jul', amount: 45000 },
        { month: 'Aug', amount: 0 },
        { month: 'Sep', amount: 0 },
        { month: 'Oct', amount: 0 },
        { month: 'Nov', amount: 0 },
        { month: 'Dec', amount: 0 }
      ]
    };
  } catch (error) {
    console.error('Error fetching producer payment analytics:', error);
    return {
      total_earnings: 0,
      pending_balance: 0,
      successful_payments: 0,
      pending_payments: 0,
      failed_payments: 0,
      recent_transactions: [],
      monthly_earnings: []
    };
  }
};
