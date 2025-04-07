
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  createProducerSubaccount, 
  updateProducerBankDetails, 
  updateProducerSplitPercentage,
  getProducerSplitCode,
  resolveAccountNumber,
  ProducerBankDetails
} from '@/utils/payment/paystackSplitUtils';

export function usePaystackSplit() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Create a subaccount for a producer
  const createSubaccount = async (producerId: string) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      return await createProducerSubaccount(producerId);
    } catch (error) {
      console.error('Error creating subaccount:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update bank details for a producer
  const updateBankDetails = async (producerId: string, bankDetails: ProducerBankDetails) => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      console.info('Updating producer bank details:', { producerId, bankDetails });
      const result = await updateProducerBankDetails(producerId, bankDetails);
      console.info('Bank details updated successfully');
      return result;
    } catch (error) {
      console.error('Error updating bank details:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update split percentage for a producer
  const updateSplitPercentage = async (producerId: string, percentage: number) => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      return await updateProducerSplitPercentage(producerId, percentage);
    } catch (error) {
      console.error('Error updating split percentage:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch split code for a producer
  const getSplitCode = async (producerId: string) => {
    if (!user) return null;
    
    try {
      return await getProducerSplitCode(producerId);
    } catch (error) {
      console.error('Error fetching split code:', error);
      return null;
    }
  };
  
  // Verify bank account
  const verifyBankAccount = async (accountNumber: string, bankCode: string) => {
    try {
      setIsVerifying(true);
      console.info('Resolving account number:', { accountNumber, bankCode });
      const resolvedName = await resolveAccountNumber(accountNumber, bankCode);
      setAccountName(resolvedName);
      console.info(resolvedName ? 'Account resolved successfully' : 'Account resolution failed');
      return resolvedName !== null;
    } catch (error) {
      console.error('Error verifying bank account:', error);
      setAccountName(null);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };
  
  return {
    isLoading,
    accountName,
    isVerifying,
    createSubaccount,
    updateBankDetails,
    updateSplitPercentage,
    getSplitCode,
    verifyBankAccount
  };
}
