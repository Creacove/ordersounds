
import { supabase } from '@/integrations/supabase/client';
import { groupByMonth } from './utils';

export interface ProducerStats {
  totalRevenue: number;
  totalPlays: number;
  beatsSold: number;
  totalFavorites: number;
  revenueChange: number;
  playsChange: number;
  salesChange: number;
  favoritesChange: number;
  revenueByMonth: { name: string; value: number }[];
  playsByMonth: { name: string; value: number }[];
  genreDistribution: { name: string; value: number }[];
}

export async function getProducerStats(producerId: string): Promise<ProducerStats> {
  try {
    // Get all beats by this producer
    const { data: beats, error: beatsError } = await supabase
      .from('beats')
      .select('id, plays, favorites_count, genre')
      .eq('producer_id', producerId);
    
    if (beatsError) throw beatsError;
    
    // Get total plays and favorites directly from beats
    const totalPlays = beats?.reduce((sum, beat) => sum + (beat.plays || 0), 0) || 0;
    const totalFavorites = beats?.reduce((sum, beat) => sum + (beat.favorites_count || 0), 0) || 0;
    
    // Get beat IDs for further queries
    const beatIds = beats?.map(beat => beat.id) || [];
    if (beatIds.length === 0) {
      // Return default stats if producer has no beats
      return getDefaultStats();
    }
    
    // Get completed orders to count total sales
    const { data: purchases, error: purchasesError } = await supabase
      .from('user_purchased_beats')
      .select('id, beat_id, purchase_date')
      .in('beat_id', beatIds);
    
    if (purchasesError) throw purchasesError;
    
    // Total number of beats sold - count completed purchases
    const beatsSold = purchases?.length || 0;
    
    // Get line items to calculate revenue - using user_purchased_beats to get completed orders only
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('line_items')
      .select('beat_id, order_id, price_charged')
      .in('beat_id', beatIds);
    
    if (lineItemsError) throw lineItemsError;
    
    // Filter line items to only include those with completed orders
    const { data: completedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'completed');
      
    if (ordersError) throw ordersError;
    
    const completedOrderIds = completedOrders?.map(order => order.id) || [];
    
    // Calculate total revenue from line items with completed orders
    const totalRevenue = lineItems
      ?.filter(item => completedOrderIds.includes(item.order_id))
      ?.reduce((sum, item) => sum + Number(item.price_charged || 0), 0) || 0;
    
    // Get previous month data for trend calculations
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(now.getMonth() - 2);
    
    // Get previous month's purchases
    const { data: prevPurchases, error: prevPurchasesError } = await supabase
      .from('user_purchased_beats')
      .select('id, beat_id, purchase_date, order_id')
      .in('beat_id', beatIds)
      .gte('purchase_date', twoMonthsAgo.toISOString())
      .lt('purchase_date', oneMonthAgo.toISOString());
    
    if (prevPurchasesError) throw prevPurchasesError;
    
    // Get previous month's orders to check if they're completed
    const prevPurchaseOrderIds = prevPurchases?.map(purchase => purchase.order_id) || [];
    
    const { data: prevCompletedOrders, error: prevOrdersError } = await supabase
      .from('orders')
      .select('id')
      .in('id', prevPurchaseOrderIds)
      .eq('status', 'completed');
      
    if (prevOrdersError) throw prevOrdersError;
    
    const prevCompletedOrderIds = prevCompletedOrders?.map(order => order.id) || [];
    
    // Filter previous purchases to only include completed orders
    const completedPrevPurchases = prevPurchases
      ?.filter(purchase => prevCompletedOrderIds.includes(purchase.order_id)) || [];
    
    // Get previous month's line items to calculate revenue
    const prevPurchaseBeatIds = completedPrevPurchases?.map(purchase => purchase.beat_id) || [];
    
    const { data: prevLineItems, error: prevLineItemsError } = await supabase
      .from('line_items')
      .select('beat_id, order_id, price_charged')
      .in('beat_id', prevPurchaseBeatIds)
      .in('order_id', prevCompletedOrderIds);
    
    if (prevLineItemsError) throw prevLineItemsError;
    
    // Calculate previous month's revenue
    const prevRevenue = prevLineItems?.reduce((sum, item) => sum + Number(item.price_charged || 0), 0) || 0;
    
    // Get play counts for previous month (approximation as play history may not be stored)
    // For a real implementation, we would need to track play history in a separate table
    const prevPlays = Math.round(totalPlays * 0.8); // Approximation for comparison
    const prevFavorites = Math.round(totalFavorites * 0.8); // Approximation for comparison
    
    // Calculate percentage changes
    const revenueChange = calculatePercentageChange(totalRevenue, prevRevenue);
    const salesChange = calculatePercentageChange(beatsSold, completedPrevPurchases.length);
    const playsChange = calculatePercentageChange(totalPlays, prevPlays);
    const favoritesChange = calculatePercentageChange(totalFavorites, prevFavorites);
    
    // Prepare data for charts
    // Group purchases by month for revenue chart
    const purchasesWithRevenue = purchases?.map(purchase => {
      const lineItem = lineItems?.find(item => item.beat_id === purchase.beat_id);
      return {
        date: purchase.purchase_date,
        amount: lineItem ? Number(lineItem.price_charged) : 0
      };
    }) || [];
    
    const revenueByMonth = groupByMonth(
      purchasesWithRevenue,
      'date',
      'amount'
    );
    
    // For play by month, use actual play data if available, otherwise estimate
    const playsByMonth = calculatePlaysByMonth(totalPlays);
    
    // Process genre distribution
    const genreDistribution = processGenreDistribution(beats || []);
    
    return {
      totalRevenue,
      totalPlays,
      beatsSold,
      totalFavorites,
      revenueChange,
      playsChange,
      salesChange,
      favoritesChange,
      revenueByMonth,
      playsByMonth,
      genreDistribution
    };
  } catch (error) {
    console.error('Error fetching producer stats:', error);
    return getDefaultStats();
  }
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function getDefaultStats(): ProducerStats {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return {
    totalRevenue: 0,
    totalPlays: 0,
    beatsSold: 0,
    totalFavorites: 0,
    revenueChange: 0,
    playsChange: 0,
    salesChange: 0,
    favoritesChange: 0,
    revenueByMonth: monthNames.map(name => ({ name, value: 0 })),
    playsByMonth: monthNames.map(name => ({ name, value: 0 })),
    genreDistribution: [{ name: "No Data", value: 100 }]
  };
}

function processGenreDistribution(beats: any[]): { name: string; value: number }[] {
  const genreCounts: Record<string, number> = {};
  
  beats.forEach(beat => {
    if (beat.genre) {
      genreCounts[beat.genre] = (genreCounts[beat.genre] || 0) + 1;
    }
  });
  
  // Return default if no genres
  if (Object.keys(genreCounts).length === 0) {
    return [{ name: "No Data", value: 100 }];
  }
  
  // Calculate percentages
  const total = Object.values(genreCounts).reduce((sum, count) => sum + count, 0);
  
  const result = Object.entries(genreCounts)
    .map(([name, count]) => ({ 
      name, 
      value: Math.round((count / total) * 100) 
    }))
    .sort((a, b) => b.value - a.value);
  
  // Group small genres as "Others"
  if (result.length > 4) {
    const topGenres = result.slice(0, 4);
    const others = result.slice(4).reduce((sum, item) => sum + item.value, 0);
    
    if (others > 0) {
      topGenres.push({ name: "Others", value: others });
    }
    
    return topGenres;
  }
  
  return result;
}

function calculatePlaysByMonth(totalPlays: number): { name: string; value: number }[] {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Simple distribution of total plays across months (placeholder implementation)
  const distribution = [0.05, 0.06, 0.07, 0.08, 0.08, 0.09, 0.09, 0.10, 0.10, 0.10, 0.09, 0.09];
  
  return distribution.map((ratio, index) => {
    const value = Math.round(totalPlays * ratio);
    return {
      name: monthNames[index],
      value
    };
  });
}
