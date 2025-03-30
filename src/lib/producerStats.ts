
import { supabase } from "./supabase";
import { calculatePercentageChange } from "./utils";

export interface ProducerStats {
  totalRevenue: number;
  monthlyRevenue: number;
  beatsSold: number;
  revenueChange: number;
  salesChange: number;
  primaryCurrency: 'NGN' | 'USD';
}

export async function getProducerStats(producerId: string): Promise<ProducerStats> {
  try {
    // Get total revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from('payments')
      .select('amount, orders(currency_used)')
      .eq('orders.beat_producer_id', producerId);
    
    if (revenueError) throw revenueError;

    // Get total beats sold
    const { data: salesData, error: salesError } = await supabase
      .from('user_purchased_beats')
      .select('beat_id, purchase_date')
      .eq('beat_producer_id', producerId);
    
    if (salesError) throw salesError;

    // Determine most common currency in transactions
    let ngnCount = 0;
    let usdCount = 0;
    
    revenueData.forEach((payment) => {
      const currencyUsed = payment.orders?.currency_used;
      if (currencyUsed === 'NGN') ngnCount++;
      else if (currencyUsed === 'USD') usdCount++;
    });
    
    const primaryCurrency = ngnCount >= usdCount ? 'NGN' : 'USD';

    // Calculate total revenue
    const totalRevenue = revenueData.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Calculate monthly revenue
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const thisMonthRevenue = revenueData
      .filter(payment => {
        if (!payment.created_at) return false;
        const paymentDate = new Date(payment.created_at);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    const lastMonthRevenue = revenueData
      .filter(payment => {
        if (!payment.created_at) return false;
        const paymentDate = new Date(payment.created_at);
        return paymentDate.getMonth() === previousMonth && paymentDate.getFullYear() === previousYear;
      })
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Calculate percentage changes
    const revenueChange = calculatePercentageChange(thisMonthRevenue, lastMonthRevenue);

    // Calculate sales change
    const currentYearSales = salesData.filter(sale => {
      const saleDate = new Date(sale.purchase_date);
      return saleDate.getFullYear() === currentYear;
    }).length;

    const previousYearSales = salesData.filter(sale => {
      const saleDate = new Date(sale.purchase_date);
      return saleDate.getFullYear() === currentYear - 1;
    }).length;

    const salesChange = calculatePercentageChange(currentYearSales, previousYearSales);

    return {
      totalRevenue,
      monthlyRevenue: thisMonthRevenue,
      beatsSold: salesData.length,
      revenueChange,
      salesChange,
      primaryCurrency
    };
  } catch (error) {
    console.error("Error getting producer stats:", error);
    return {
      totalRevenue: 0,
      monthlyRevenue: 0,
      beatsSold: 0,
      revenueChange: 0,
      salesChange: 0,
      primaryCurrency: 'NGN'
    };
  }
}
