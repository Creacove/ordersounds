
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

/**
 * Creates a subaccount and transaction split for a producer
 */
export const createProducerSubaccount = async (producerId: string): Promise<SubaccountResponse | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('paystack-split', {
      body: { 
        action: 'create-subaccount',
        producerId 
      },
    });
    
    if (error) {
      console.error('Error creating producer subaccount:', error);
      toast.error('Failed to create payment account. Please try again.');
      return null;
    }
    
    console.log('Subaccount created successfully:', data);
    toast.success('Payment account created successfully');
    
    return data;
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
    const { data, error } = await supabase.functions.invoke('paystack-split', {
      body: { 
        action: 'update-subaccount',
        producerId,
        bankCode: bankDetails.bank_code,
        accountNumber: bankDetails.account_number
      },
    });
    
    if (error) {
      console.error('Error updating producer bank details:', error);
      toast.error('Failed to update bank details. Please try again.');
      return false;
    }
    
    console.log('Bank details updated successfully:', data);
    toast.success('Bank details updated successfully');
    
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
    
    const { data, error } = await supabase.functions.invoke('paystack-split', {
      body: { 
        action: 'update-split',
        producerId,
        share: sharePercentage
      },
    });
    
    if (error) {
      console.error('Error updating split percentage:', error);
      toast.error('Failed to update split percentage. Please try again.');
      return false;
    }
    
    console.log('Split percentage updated successfully:', data);
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
    const response = await fetch('https://api.paystack.co/bank', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch banks');
    }
    
    const data = await response.json();
    return data.data || [];
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
    // For demo purposes, we're faking the response
    console.log('Resolving account number (simulated):', accountNumber, bankCode);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success
    if (accountNumber.length === 10) {
      // Generate a fake name based on bank code and account number
      const bankInitial = bankCode.substring(0, 1).toUpperCase();
      const lastFour = accountNumber.slice(-4);
      return `Account Holder ${bankInitial}${lastFour}`;
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
    const { data, error } = await supabase.functions.invoke('paystack-split', {
      body: { action: 'subaccounts' },
    });
    
    if (error) {
      console.error('Error fetching subaccounts:', error);
      return [];
    }
    
    return data || [];
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
    const { data, error } = await supabase.functions.invoke('paystack-split', {
      body: { action: 'splits' },
    });
    
    if (error) {
      console.error('Error fetching splits:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching splits:', error);
    return [];
  }
};
