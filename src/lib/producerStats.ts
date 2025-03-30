
import { supabase } from "./supabase";
import { calculatePercentageChange } from "./utils";

// Data points for monthly charts
export interface ChartDataPoint {
  name: string;
  value: number;
}

// Genre distribution data point
export interface GenreDataPoint {
  name: string;
  value: number;
}

export interface ProducerStats {
  totalRevenue: number;
  monthlyRevenue: number;
  beatsSold: number;
  revenueChange: number;
  salesChange: number;
  primaryCurrency: 'NGN' | 'USD';
  // Add missing properties needed by dashboard components
  totalPlays: number;
  totalFavorites: number;
  playsChange: number;
  favoritesChange: number;
  revenueByMonth: ChartDataPoint[];
  playsByMonth: ChartDataPoint[];
  genreDistribution: GenreDataPoint[];
}

export async function getProducerStats(producerId: string): Promise<ProducerStats> {
  try {
    // Get total revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from('payments')
      .select('amount, created_at, orders!inner(currency_used)')
      .eq('orders.buyer_id', producerId);
    
    if (revenueError) throw revenueError;

    // Get total beats sold
    const { data: salesData, error: salesError } = await supabase
      .from('user_purchased_beats')
      .select('beat_id, purchase_date, beats!inner(producer_id)')
      .eq('beats.producer_id', producerId);
    
    if (salesError) throw salesError;

    // Get total plays (using 0 as placeholder since we don't have that data yet)
    const totalPlays = 0;
    const playsChange = 0;

    // Get total favorites (using 0 as placeholder)
    const totalFavorites = 0;
    const favoritesChange = 0;

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

    // Generate revenue by month data (last 6 months)
    const revenueByMonth: ChartDataPoint[] = generateMonthlyData(revenueData, 6, 'amount');

    // Generate plays by month data (placeholder)
    const playsByMonth: ChartDataPoint[] = [
      { name: 'Jan', value: 0 },
      { name: 'Feb', value: 0 },
      { name: 'Mar', value: 0 },
      { name: 'Apr', value: 0 },
      { name: 'May', value: 0 },
      { name: 'Jun', value: 0 }
    ];

    // Generate genre distribution data (placeholder)
    const genreDistribution: GenreDataPoint[] = [
      { name: 'Afrobeats', value: 40 },
      { name: 'Hip Hop', value: 30 },
      { name: 'R&B', value: 20 },
      { name: 'Amapiano', value: 10 }
    ];

    return {
      totalRevenue,
      monthlyRevenue: thisMonthRevenue,
      beatsSold: salesData.length,
      revenueChange,
      salesChange,
      primaryCurrency,
      totalPlays,
      playsChange,
      totalFavorites,
      favoritesChange,
      revenueByMonth,
      playsByMonth,
      genreDistribution
    };
  } catch (error) {
    console.error("Error getting producer stats:", error);
    return {
      totalRevenue: 0,
      monthlyRevenue: 0,
      beatsSold: 0,
      revenueChange: 0,
      salesChange: 0,
      primaryCurrency: 'NGN',
      totalPlays: 0,
      playsChange: 0,
      totalFavorites: 0,
      favoritesChange: 0,
      revenueByMonth: [],
      playsByMonth: [],
      genreDistribution: []
    };
  }
}

// Helper function to generate monthly data for charts
function generateMonthlyData(
  data: any[], 
  monthsCount: number = 6, 
  valueField: string = 'amount'
): ChartDataPoint[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result: ChartDataPoint[] = [];
  
  const now = new Date();
  const currentMonth = now.getMonth();
  
  // Get the last N months
  for (let i = monthsCount - 1; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const monthName = months[monthIndex];
    const monthYear = new Date(now.getFullYear(), monthIndex).getFullYear();
    
    // Sum values for this month across years
    const monthValue = data.reduce((sum, item) => {
      if (!item.created_at) return sum;
      
      const itemDate = new Date(item.created_at);
      if (itemDate.getMonth() === monthIndex && itemDate.getFullYear() === monthYear) {
        return sum + (item[valueField] || 0);
      }
      return sum;
    }, 0);
    
    result.push({ name: monthName, value: monthValue });
  }
  
  return result;
}
