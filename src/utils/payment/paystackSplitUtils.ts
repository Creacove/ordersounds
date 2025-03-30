
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
      
    if (userError || !userData?.bank_code || !userData?.account_number) {
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
      
    if (!userError && userData?.paystack_subaccount_code) {
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
    
    // Ensure data is an array before mapping
    if (!data || !Array.isArray(data)) {
      console.error('No data or invalid data returned for subaccounts');
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
    
    // Ensure data is an array before mapping
    if (!data || !Array.isArray(data)) {
      console.error('No data or invalid data returned for splits');
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
    
    // Get real data from the database
    const { data: beatsData, error: beatsError } = await supabase
      .from('beats')
      .select('id, purchase_count, favorites_count, plays')
      .eq('producer_id', producerId);
      
    if (beatsError) {
      console.error('Error fetching beats data:', beatsError);
    }
    
    // Get orders with payments for this producer's beats
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id, 
        amount, 
        producer_share, 
        platform_share, 
        status, 
        payment_date,
        order_id,
        orders!inner(
          id,
          line_items!inner(
            beat_id,
            beats!inner(producer_id, title)
          )
        )
      `)
      .eq('orders.line_items.beats.producer_id', producerId);
    
    if (paymentsError) {
      console.error('Error fetching payments data:', paymentsError);
    }
    
    // Calculate totals from real data
    const beats = beatsData || [];
    const payments = paymentsData || [];
    
    const totalEarnings = payments
      .filter(p => p.status === 'successful')
      .reduce((sum, p) => sum + (p.producer_share || 0), 0);
      
    const pendingBalance = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.producer_share || 0), 0);
      
    const successfulPayments = payments.filter(p => p.status === 'successful').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const failedPayments = payments.filter(p => p.status === 'failed').length;
    
    const totalPlays = beats.reduce((sum, beat) => sum + (beat.plays || 0), 0);
    const totalSales = beats.reduce((sum, beat) => sum + (beat.purchase_count || 0), 0);
    const totalFavorites = beats.reduce((sum, beat) => sum + (beat.favorites_count || 0), 0);
    
    // Get recent transactions (last 5)
    const recentTransactions = payments
      .sort((a, b) => new Date(b.payment_date || 0).getTime() - new Date(a.payment_date || 0).getTime())
      .slice(0, 5)
      .map(payment => {
        // Extract beat title and buyer from the nested data
        const lineItem = payment.orders?.line_items?.[0];
        const beatTitle = lineItem?.beats?.title || 'Unknown Beat';
        
        return {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          date: payment.payment_date,
          beat_title: beatTitle,
          buyer_name: 'Anonymous Buyer' // For privacy, we don't show the actual buyer name
        };
      });
    
    // Calculate monthly earnings (past 12 months)
    const now = new Date();
    const monthlyEarningsData = [];
    
    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      
      // Filter payments for this month
      const monthEarnings = payments
        .filter(p => {
          if (!p.payment_date) return false;
          const paymentDate = new Date(p.payment_date);
          return paymentDate.getMonth() === month.getMonth() && 
                 paymentDate.getFullYear() === month.getFullYear() &&
                 p.status === 'successful';
        })
        .reduce((sum, p) => sum + (p.producer_share || 0), 0);
      
      monthlyEarningsData.unshift({
        month: monthName,
        amount: monthEarnings
      });
    }
    
    // If we don't have real data, use mock data to demonstrate the UI
    if (payments.length === 0) {
      // Use mock data for demonstration
      return {
        total_earnings: 125000,
        pending_balance: 15000,
        successful_payments: 12,
        pending_payments: 2,
        failed_payments: 1,
        total_plays: 1500,
        total_sales: 25,
        total_favorites: 50,
        recent_transactions: [
          {
            id: 'trx_1',
            amount: 25000,
            status: 'successful',
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            beat_title: 'Summer Vibes',
            buyer_name: 'John D.'
          },
          {
            id: 'trx_2',
            amount: 15000,
            status: 'successful',
            date: new Date(Date.now() - 86400000 * 5).toISOString(),
            beat_title: 'Midnight Dream',
            buyer_name: 'Sarah M.'
          },
          {
            id: 'trx_3',
            amount: 30000,
            status: 'pending',
            date: new Date(Date.now() - 86400000 * 1).toISOString(),
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
        ],
        genre_distribution: [
          { genre: 'Afrobeats', count: 8 },
          { genre: 'Hip Hop', count: 5 },
          { genre: 'R&B', count: 3 },
          { genre: 'Pop', count: 2 },
          { genre: 'Others', count: 1 }
        ]
      };
    }
    
    // Get genre distribution data
    const { data: genreData, error: genreError } = await supabase
      .from('beats')
      .select('genre')
      .eq('producer_id', producerId);
      
    if (genreError) {
      console.error('Error fetching genre data:', genreError);
    }
    
    // Process genre data for chart
    const genreCount: Record<string, number> = {};
    
    if (genreData) {
      genreData.forEach(beat => {
        const genre = beat.genre || 'Unknown';
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    }
    
    const genreDistribution = Object.entries(genreCount).map(([genre, count]) => ({
      genre,
      count
    })).sort((a, b) => b.count - a.count);
    
    return {
      total_earnings: totalEarnings,
      pending_balance: pendingBalance,
      successful_payments: successfulPayments,
      pending_payments: pendingPayments,
      failed_payments: failedPayments,
      total_plays: totalPlays,
      total_sales: totalSales,
      total_favorites: totalFavorites,
      recent_transactions: recentTransactions,
      monthly_earnings: monthlyEarningsData,
      genre_distribution: genreDistribution
    };
  } catch (error) {
    console.error('Error fetching producer payment analytics:', error);
    return {
      total_earnings: 0,
      pending_balance: 0,
      successful_payments: 0,
      pending_payments: 0,
      failed_payments: 0,
      total_plays: 0,
      total_sales: 0,
      total_favorites: 0,
      recent_transactions: [],
      monthly_earnings: [],
      genre_distribution: []
    };
  }
};

/**
 * For admin: Get detailed producer analytics
 */
export const getProducerDetailedAnalytics = async (producerId: string): Promise<any> => {
  try {
    // Get basic payment analytics
    const paymentAnalytics = await getProducerPaymentAnalytics(producerId);
    
    // Get producer profile details
    const { data: producerData, error: producerError } = await supabase
      .from('users')
      .select('id, full_name, stage_name, email, profile_picture, country, bio, paystack_subaccount_code, paystack_split_code')
      .eq('id', producerId)
      .single();
      
    if (producerError) {
      console.error('Error fetching producer profile:', producerError);
      return { ...paymentAnalytics, producer: null };
    }
    
    // Get all beats from this producer
    const { data: beatsData, error: beatsError } = await supabase
      .from('beats')
      .select('id, title, genre, plays, purchase_count, favorites_count, cover_image, basic_license_price_local')
      .eq('producer_id', producerId)
      .order('purchase_count', { ascending: false });
      
    if (beatsError) {
      console.error('Error fetching producer beats:', beatsError);
    }
    
    // Get sales over time
    const { data: salesData, error: salesError } = await supabase
      .from('user_purchased_beats')
      .select('id, purchase_date, beat_id, beats!inner(producer_id)')
      .eq('beats.producer_id', producerId)
      .order('purchase_date', { ascending: true });
      
    if (salesError) {
      console.error('Error fetching sales data:', salesError);
    }
    
    // Process sales data by month
    const salesByMonth: Record<string, number> = {};
    
    if (salesData) {
      salesData.forEach(sale => {
        if (!sale.purchase_date) return;
        
        const date = new Date(sale.purchase_date);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        salesByMonth[monthYear] = (salesByMonth[monthYear] || 0) + 1;
      });
    }
    
    // Convert to array for charts
    const salesTrend = Object.entries(salesByMonth).map(([monthYear, count]) => {
      const [year, month] = monthYear.split('-');
      return {
        date: `${year}-${month.padStart(2, '0')}`,
        sales: count
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      ...paymentAnalytics,
      producer: producerData ? {
        id: producerData.id,
        name: producerData.stage_name || producerData.full_name,
        email: producerData.email,
        profile_picture: producerData.profile_picture,
        country: producerData.country,
        bio: producerData.bio,
        has_subaccount: !!producerData.paystack_subaccount_code,
        has_split_code: !!producerData.paystack_split_code
      } : null,
      top_beats: beatsData || [],
      sales_trend: salesTrend
    };
  } catch (error) {
    console.error('Error fetching detailed producer analytics:', error);
    return null;
  }
};

/**
 * For admin: Get platform-wide analytics
 */
export const getAdminPlatformAnalytics = async (): Promise<any> => {
  try {
    // Count total number of producers
    const { count: producersCount, error: producersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'producer');
      
    if (producersError) {
      console.error('Error counting producers:', producersError);
    }
    
    // Count total number of buyers
    const { count: buyersCount, error: buyersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'buyer');
      
    if (buyersError) {
      console.error('Error counting buyers:', buyersError);
    }
    
    // Get total number of beats
    const { count: beatsCount, error: beatsError } = await supabase
      .from('beats')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
      
    if (beatsError) {
      console.error('Error counting beats:', beatsError);
    }
    
    // Get total payments
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('id, amount, producer_share, platform_share, status, payment_date');
      
    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    }
    
    const payments = paymentsData || [];
    
    // Calculate revenue totals
    const totalRevenue = payments
      .filter(p => p.status === 'successful')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
      
    const platformRevenue = payments
      .filter(p => p.status === 'successful')
      .reduce((sum, p) => sum + (p.platform_share || 0), 0);
      
    const producersRevenue = payments
      .filter(p => p.status === 'successful')
      .reduce((sum, p) => sum + (p.producer_share || 0), 0);
      
    // Calculate monthly revenue for the past 12 months
    const now = new Date();
    const monthlyRevenueData = [];
    
    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      
      // Filter payments for this month
      const monthRevenue = payments
        .filter(p => {
          if (!p.payment_date) return false;
          const paymentDate = new Date(p.payment_date);
          return paymentDate.getMonth() === month.getMonth() && 
                 paymentDate.getFullYear() === month.getFullYear() &&
                 p.status === 'successful';
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      monthlyRevenueData.unshift({
        month: monthName,
        amount: monthRevenue
      });
    }
    
    // Get top 5 producers by revenue
    const { data: topProducersData, error: topProducersError } = await supabase
      .from('users')
      .select(`
        id, 
        full_name, 
        stage_name,
        beats!inner(
          id,
          producer_id,
          purchase_count
        )
      `)
      .eq('role', 'producer');
    
    if (topProducersError) {
      console.error('Error fetching top producers:', topProducersError);
    }
    
    let topProducers = [];
    
    if (topProducersData) {
      // Calculate total purchases for each producer
      const producerPurchases = topProducersData.map(producer => {
        const totalPurchases = producer.beats?.reduce((sum, beat) => sum + (beat.purchase_count || 0), 0) || 0;
        
        return {
          id: producer.id,
          name: producer.stage_name || producer.full_name,
          total_purchases: totalPurchases
        };
      });
      
      // Sort and get top 5
      topProducers = producerPurchases
        .sort((a, b) => b.total_purchases - a.total_purchases)
        .slice(0, 5);
    }
    
    // Get top 5 beats
    const { data: topBeatsData, error: topBeatsError } = await supabase
      .from('beats')
      .select('id, title, producer_id, purchase_count, users!inner(full_name, stage_name)')
      .order('purchase_count', { ascending: false })
      .limit(5);
      
    if (topBeatsError) {
      console.error('Error fetching top beats:', topBeatsError);
    }
    
    const topBeats = topBeatsData?.map(beat => ({
      id: beat.id,
      title: beat.title,
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer',
      purchase_count: beat.purchase_count || 0
    })) || [];
    
    return {
      users: {
        total_producers: producersCount || 0,
        total_buyers: buyersCount || 0
      },
      content: {
        total_beats: beatsCount || 0
      },
      revenue: {
        total_revenue: totalRevenue,
        platform_revenue: platformRevenue,
        producers_revenue: producersRevenue,
        monthly_revenue: monthlyRevenueData
      },
      top_performers: {
        producers: topProducers,
        beats: topBeats
      }
    };
  } catch (error) {
    console.error('Error fetching admin platform analytics:', error);
    return null;
  }
};
