
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
    
    // Get beat sales with payment details
    const beatIds = beats?.map(beat => beat.id) || [];
    
    const { data: sales, error: salesError } = await supabase
      .from('user_purchased_beats')
      .select(`
        id, 
        purchase_date, 
        beat_id, 
        currency_code,
        license_type,
        line_items(price_charged)
      `)
      .in('beat_id', beatIds.length > 0 ? beatIds : ['no-beats']);
    
    if (salesError) throw salesError;
    
    // Calculate totals
    const totalPlays = beats?.reduce((sum, beat) => sum + (beat.plays || 0), 0) || 0;
    const totalFavorites = beats?.reduce((sum, beat) => sum + (beat.favorites_count || 0), 0) || 0;
    const beatsSold = sales?.length || 0;
    
    // Calculate total revenue from sales
    let totalRevenue = 0;
    sales?.forEach(sale => {
      if (sale.line_items && sale.line_items.price_charged) {
        totalRevenue += Number(sale.line_items.price_charged);
      }
    });
    
    // Get sales from previous period (last month) for comparison
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(now.getMonth() - 2);
    
    const { data: prevSales, error: prevSalesError } = await supabase
      .from('user_purchased_beats')
      .select('id, purchase_date, beat_id, line_items(price_charged)')
      .in('beat_id', beatIds.length > 0 ? beatIds : ['no-beats'])
      .gte('purchase_date', twoMonthsAgo.toISOString())
      .lt('purchase_date', oneMonthAgo.toISOString());
    
    if (prevSalesError) throw prevSalesError;
    
    let prevRevenue = 0;
    prevSales?.forEach(sale => {
      if (sale.line_items && sale.line_items.price_charged) {
        prevRevenue += Number(sale.line_items.price_charged);
      }
    });
    
    // Calculate percentage changes
    const revenueChange = prevRevenue === 0 ? 
      (totalRevenue > 0 ? 100 : 0) : 
      Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);
    
    // Get play and favorite counts from previous period
    // This would require storing historical data, using placeholder for now
    const playsChange = 18; // Placeholder
    const salesChange = beatsSold > 0 ? 5 : 0; // Placeholder
    const favoritesChange = totalFavorites > 0 ? 24 : 0; // Placeholder
    
    // Get monthly data for charts
    const allSales = [...(sales || []), ...(prevSales || [])];
    const revenueByMonth = groupByMonth(
      allSales.map(sale => ({
        date: sale.purchase_date,
        amount: sale.line_items ? sale.line_items.price_charged : 0
      })),
      'date',
      'amount'
    );
    
    // Placeholder for plays by month - would need historical data
    const playsByMonth = [
      { name: "Jan", value: 1200 },
      { name: "Feb", value: 1900 },
      { name: "Mar", value: 2500 },
      { name: "Apr", value: 3200 },
      { name: "May", value: 2800 },
      { name: "Jun", value: 3500 },
      { name: "Jul", value: 4200 },
      { name: "Aug", value: 5000 },
      { name: "Sep", value: 5500 },
      { name: "Oct", value: 6200 },
      { name: "Nov", value: 7500 },
      { name: "Dec", value: 8200 },
    ];
    
    // Process genre distribution
    const genreDistribution = beats && beats.length > 0 ? 
      processGenreDistribution(beats) : 
      [
        { name: "Afrobeat", value: 45 },
        { name: "Amapiano", value: 25 },
        { name: "Hip Hop", value: 15 },
        { name: "R&B", value: 10 },
        { name: "Others", value: 5 },
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
