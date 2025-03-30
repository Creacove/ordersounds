
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
  // Properties needed by dashboard components
  totalPlays: number;
  playsChange: number;
  totalFavorites: number;
  favoritesChange: number;
  revenueByMonth: ChartDataPoint[];
  playsByMonth: ChartDataPoint[];
  genreDistribution: GenreDataPoint[];
}

export async function getProducerStats(producerId: string): Promise<ProducerStats> {
  try {
    // Get producer's beats
    const { data: producerBeats, error: beatsError } = await supabase
      .from('beats')
      .select('id')
      .eq('producer_id', producerId);
    
    if (beatsError) throw beatsError;
    
    // Extract beat IDs
    const beatIds = producerBeats.map(beat => beat.id);
    
    if (beatIds.length === 0) {
      // Return default stats if producer has no beats
      return getDefaultStats();
    }

    // Get total sales and revenue from purchases linked to producer's beats
    const { data: salesData, error: salesError } = await supabase
      .from('user_purchased_beats')
      .select(`
        id, 
        beat_id, 
        purchase_date, 
        order_id, 
        orders(id, total_price, currency_used, payment_method)
      `)
      .in('beat_id', beatIds);
    
    if (salesError) throw salesError;
    
    // Calculate total beats sold
    const beatsSold = salesData.length;
    
    // Calculate total revenue from orders
    let totalRevenue = 0;
    let ngnCount = 0;
    let usdCount = 0;
    
    // Create a Set to track unique order IDs to avoid double counting
    const processedOrderIds = new Set();
    
    // Process sales data to calculate revenue
    salesData.forEach(sale => {
      // TypeScript safety: Check if orders property exists and is an object
      if (sale.orders && typeof sale.orders === 'object') {
        const orderData = sale.orders;
        
        // Check if the order ID exists and only count each order once
        if (orderData.id && !processedOrderIds.has(orderData.id)) {
          // Add order total to revenue
          totalRevenue += (orderData.total_price || 0);
          processedOrderIds.add(orderData.id);
          
          // Count currencies
          if (orderData.currency_used === 'NGN') {
            ngnCount++;
          } else if (orderData.currency_used === 'USD') {
            usdCount++;
          }
        }
      }
    });
    
    // Determine primary currency
    const primaryCurrency = ngnCount >= usdCount ? 'NGN' : 'USD';
    
    // Calculate monthly revenue and sales
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Filter sales for current month
    const thisMonthSales = salesData.filter(sale => {
      if (!sale.purchase_date) return false;
      const purchaseDate = new Date(sale.purchase_date);
      return purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear;
    });
    
    // Filter sales for previous month
    const lastMonthSales = salesData.filter(sale => {
      if (!sale.purchase_date) return false;
      const purchaseDate = new Date(sale.purchase_date);
      return purchaseDate.getMonth() === previousMonth && purchaseDate.getFullYear() === previousYear;
    });
    
    // Calculate revenue for current month (from unique orders)
    let thisMonthRevenue = 0;
    const thisMonthOrderIds = new Set();
    
    thisMonthSales.forEach(sale => {
      if (sale.orders && typeof sale.orders === 'object') {
        const orderData = sale.orders;
        
        if (orderData.id && !thisMonthOrderIds.has(orderData.id)) {
          thisMonthRevenue += (orderData.total_price || 0);
          thisMonthOrderIds.add(orderData.id);
        }
      }
    });
    
    // Calculate revenue for last month (from unique orders)
    let lastMonthRevenue = 0;
    const lastMonthOrderIds = new Set();
    
    lastMonthSales.forEach(sale => {
      if (sale.orders && typeof sale.orders === 'object') {
        const orderData = sale.orders;
        
        if (orderData.id && !lastMonthOrderIds.has(orderData.id)) {
          lastMonthRevenue += (orderData.total_price || 0);
          lastMonthOrderIds.add(orderData.id);
        }
      }
    });
    
    // Calculate percentage changes
    const revenueChange = calculatePercentageChange(thisMonthRevenue, lastMonthRevenue);
    const salesChange = calculatePercentageChange(thisMonthSales.length, lastMonthSales.length);
    
    // Get total plays (using 0 as placeholder since we don't have that data yet)
    const totalPlays = 0;
    const playsChange = 0;
    
    // Get total favorites (using 0 as placeholder)
    const totalFavorites = 0;
    const favoritesChange = 0;
    
    // Generate revenue by month data
    const revenueByMonth = generateMonthlyRevenueData(salesData, 6);
    
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
      beatsSold,
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
    return getDefaultStats();
  }
}

// Helper function to generate default stats
function getDefaultStats(): ProducerStats {
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

// Helper function to generate monthly revenue data
function generateMonthlyRevenueData(salesData: any[], monthsCount: number = 6): ChartDataPoint[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result: ChartDataPoint[] = [];
  
  const now = new Date();
  const currentMonth = now.getMonth();
  
  // Track processed orders to avoid double counting
  const processedOrdersByMonth: Record<string, Set<string>> = {};
  
  // Initialize the result array with empty values for each month
  for (let i = monthsCount - 1; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const monthName = months[monthIndex];
    const monthYear = new Date(now.getFullYear(), monthIndex < currentMonth ? now.getFullYear() : now.getFullYear() - 1).getFullYear();
    
    // Initialize set for tracking processed orders
    const monthKey = `${monthYear}-${monthIndex}`;
    processedOrdersByMonth[monthKey] = new Set();
    
    result.push({ name: monthName, value: 0 });
  }
  
  // Calculate revenue for each month
  salesData.forEach(sale => {
    if (!sale.purchase_date || !sale.orders || typeof sale.orders !== 'object') return;
    
    const orderData = sale.orders;
    
    // Skip if order has no ID or total_price
    if (!orderData.id || orderData.total_price === undefined) return;
    
    const purchaseDate = new Date(sale.purchase_date);
    const purchaseMonth = purchaseDate.getMonth();
    const purchaseYear = purchaseDate.getFullYear();
    
    // Check if this month is within our range
    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthYear = new Date(now.getFullYear(), monthIndex < currentMonth ? now.getFullYear() : now.getFullYear() - 1).getFullYear();
      
      if (purchaseMonth === monthIndex && purchaseYear === monthYear) {
        const monthKey = `${monthYear}-${monthIndex}`;
        
        // Only count each order once per month
        if (!processedOrdersByMonth[monthKey].has(orderData.id)) {
          // Add to the correct month's value
          const monthPosition = monthsCount - 1 - i;
          result[monthPosition].value += (orderData.total_price || 0);
          
          // Mark this order as processed for this month
          processedOrdersByMonth[monthKey].add(orderData.id);
        }
      }
    }
  });
  
  return result;
}
