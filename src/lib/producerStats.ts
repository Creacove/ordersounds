
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
    
    // Get beat sales
    const beatIds = beats?.map(beat => beat.id) || [];
    
    const { data: sales, error: salesError } = await supabase
      .from('user_purchased_beats')
      .select(`
        id, 
        purchase_date, 
        beat_id, 
        currency_code,
        license_type
      `)
      .in('beat_id', beatIds.length > 0 ? beatIds : ['no-beats']);
    
    if (salesError) throw salesError;
    
    // Get line items separately to calculate revenue
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('line_items')
      .select('beat_id, price_charged')
      .in('beat_id', beatIds.length > 0 ? beatIds : ['no-beats']);
    
    if (lineItemsError) throw lineItemsError;
    
    // Calculate totals
    const totalPlays = beats?.reduce((sum, beat) => sum + (beat.plays || 0), 0) || 0;
    const totalFavorites = beats?.reduce((sum, beat) => sum + (beat.favorites_count || 0), 0) || 0;
    const beatsSold = sales?.length || 0;
    
    // Calculate total revenue by summing up all line items for the producer's beats
    let totalRevenue = 0;
    if (lineItems && lineItems.length > 0) {
      totalRevenue = lineItems.reduce((sum, item) => sum + Number(item.price_charged || 0), 0);
    }
    
    // Get sales from previous period (last month) for comparison
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(now.getMonth() - 2);
    
    // Get previous month's sales
    const { data: prevSales, error: prevSalesError } = await supabase
      .from('user_purchased_beats')
      .select('id, purchase_date, beat_id')
      .in('beat_id', beatIds.length > 0 ? beatIds : ['no-beats'])
      .gte('purchase_date', twoMonthsAgo.toISOString())
      .lt('purchase_date', oneMonthAgo.toISOString());
    
    if (prevSalesError) throw prevSalesError;
    
    // Get previous month's line items
    const prevSaleIds = prevSales?.map(sale => sale.beat_id) || [];
    const { data: prevLineItems, error: prevLineItemsError } = await supabase
      .from('line_items')
      .select('beat_id, price_charged')
      .in('beat_id', prevSaleIds.length > 0 ? prevSaleIds : ['no-beats']);
    
    if (prevLineItemsError) throw prevLineItemsError;
    
    // Calculate previous revenue
    let prevRevenue = 0;
    if (prevLineItems && prevLineItems.length > 0) {
      prevRevenue = prevLineItems.reduce((sum, item) => sum + Number(item.price_charged || 0), 0);
    }
    
    // Calculate percentage changes
    const revenueChange = prevRevenue === 0 ? 
      (totalRevenue > 0 ? 100 : 0) : 
      Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);
    
    // For plays, get previous month data if available, otherwise use placeholder
    const prevPlays = 0; // In a real implementation, would fetch historical play data
    const playsChange = prevPlays === 0 ? 
      (totalPlays > 0 ? 100 : 0) : 
      Math.round(((totalPlays - prevPlays) / prevPlays) * 100);
    
    // For sales, calculate change
    const prevBeatsSold = prevSales?.length || 0;
    const salesChange = prevBeatsSold === 0 ? 
      (beatsSold > 0 ? 100 : 0) : 
      Math.round(((beatsSold - prevBeatsSold) / prevBeatsSold) * 100);
    
    // For favorites, use placeholder or calculate if historical data available
    const prevFavorites = 0; // In a real implementation, would fetch historical favorites data
    const favoritesChange = prevFavorites === 0 ? 
      (totalFavorites > 0 ? 100 : 0) : 
      Math.round(((totalFavorites - prevFavorites) / prevFavorites) * 100);
    
    // Get all sales for revenue by month chart
    const allSaleIds = [...(sales?.map(s => s.beat_id) || []), ...(prevSales?.map(s => s.beat_id) || [])];
    
    const { data: allLineItems, error: allLineItemsError } = await supabase
      .from('line_items')
      .select('beat_id, price_charged')
      .in('beat_id', allSaleIds.length > 0 ? allSaleIds : ['no-beats']);
    
    if (allLineItemsError) throw allLineItemsError;
    
    // Prepare data for charts
    // For revenue by month, we need to join sales with line items
    const salesWithRevenue = sales?.map(sale => {
      const lineItem = allLineItems?.find(item => item.beat_id === sale.beat_id);
      return {
        date: sale.purchase_date,
        amount: lineItem ? Number(lineItem.price_charged) : 0
      };
    }) || [];
    
    const revenueByMonth = groupByMonth(
      salesWithRevenue,
      'date',
      'amount'
    );
    
    // Prepare plays by month - using real aggregated data if available
    // For this implementation, using calculated data from beats
    const playsByMonth = calculatePlaysByMonth(beats || []);
    
    // Process genre distribution
    const genreDistribution = beats && beats.length > 0 ? 
      processGenreDistribution(beats) : 
      [
        { name: "No Data", value: 100 }
      ];
    
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
    // Return default values in case of error
    return {
      totalRevenue: 0,
      totalPlays: 0,
      beatsSold: 0,
      totalFavorites: 0,
      revenueChange: 0,
      playsChange: 0,
      salesChange: 0,
      favoritesChange: 0,
      revenueByMonth: new Array(12).fill(0).map((_, i) => ({ 
        name: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i], 
        value: 0 
      })),
      playsByMonth: new Array(12).fill(0).map((_, i) => ({ 
        name: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i], 
        value: 0 
      })),
      genreDistribution: [
        { name: "No Data", value: 100 }
      ]
    };
  }
}

function processGenreDistribution(beats: any[]): { name: string; value: number }[] {
  const genreCounts: Record<string, number> = {};
  
  beats.forEach(beat => {
    if (beat.genre) {
      genreCounts[beat.genre] = (genreCounts[beat.genre] || 0) + 1;
    }
  });
  
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

function calculatePlaysByMonth(beats: any[]): { name: string; value: number }[] {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const totalPlays = beats.reduce((sum, beat) => sum + (beat.plays || 0), 0);
  
  // Since we don't have monthly play data, distribute the total plays across months
  // This is a placeholder implementation that should be replaced with real data
  let remainingPlays = totalPlays;
  const distribution = [0.05, 0.06, 0.07, 0.08, 0.08, 0.09, 0.09, 0.10, 0.10, 0.10, 0.09, 0.09];
  
  return distribution.map((ratio, index) => {
    const value = Math.round(totalPlays * ratio);
    return {
      name: monthNames[index],
      value
    };
  });
}
