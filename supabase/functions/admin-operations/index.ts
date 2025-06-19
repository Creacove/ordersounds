
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminOperationRequest {
  operation: string;
  count?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    const { operation, count = 5 }: AdminOperationRequest = await req.json()
    
    if (operation === 'refresh_trending_beats') {
      console.log(`Admin ${user.id} requested trending beats refresh with count: ${count}`)
      
      // Start transaction - reset all trending beats to false
      const { error: resetError } = await supabase
        .from('beats')
        .update({ is_trending: false })
        .eq('status', 'published')
      
      if (resetError) {
        console.error('Error resetting trending beats:', resetError)
        throw new Error('Failed to reset trending beats')
      }

      // Get random published beats to set as trending
      const { data: randomBeats, error: selectError } = await supabase
        .rpc('get_random_published_beats', { beat_count: count })
      
      if (selectError) {
        console.error('Error selecting random beats:', selectError)
        throw new Error('Failed to select random beats')
      }

      if (!randomBeats || randomBeats.length === 0) {
        throw new Error('No published beats available to set as trending')
      }

      // Set selected beats as trending
      const beatIds = randomBeats.map((beat: any) => beat.id)
      const { error: updateError } = await supabase
        .from('beats')
        .update({ is_trending: true })
        .in('id', beatIds)
      
      if (updateError) {
        console.error('Error updating trending beats:', updateError)
        throw new Error('Failed to update trending beats')
      }

      // Log the operation for audit purposes
      console.log(`Successfully updated ${beatIds.length} beats as trending:`, beatIds)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated_count: beatIds.length,
          beat_ids: beatIds 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    if (operation === 'refresh_featured_beats') {
      const featuredCount = Math.min(count || 1, 1) // Enforce max 1 featured beat
      console.log(`Admin ${user.id} requested featured beats refresh with count: ${featuredCount}`)
      
      // Use the database function for atomic operation
      const { data: featuredBeats, error: featuredError } = await supabase
        .rpc('refresh_featured_beats', { beat_count: featuredCount })
      
      if (featuredError) {
        console.error('Error refreshing featured beats:', featuredError)
        throw new Error('Failed to refresh featured beats')
      }

      if (!featuredBeats || featuredBeats.length === 0) {
        throw new Error('No published beats available to set as featured')
      }

      const beatIds = featuredBeats.map((beat: any) => beat.id)
      console.log(`Successfully updated ${beatIds.length} beats as featured:`, beatIds)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated_count: beatIds.length,
          beat_ids: beatIds 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    if (operation === 'refresh_weekly_picks') {
      const weeklyCount = Math.max(5, Math.min(count || 6, 7)) // Enforce 5-7 range
      console.log(`Admin ${user.id} requested weekly picks refresh with count: ${weeklyCount}`)
      
      // Use the database function for atomic operation
      const { data: weeklyBeats, error: weeklyError } = await supabase
        .rpc('refresh_weekly_picks', { beat_count: weeklyCount })
      
      if (weeklyError) {
        console.error('Error refreshing weekly picks:', weeklyError)
        throw new Error('Failed to refresh weekly picks')
      }

      if (!weeklyBeats || weeklyBeats.length === 0) {
        throw new Error('No published beats available to set as weekly picks')
      }

      const beatIds = weeklyBeats.map((beat: any) => beat.id)
      console.log(`Successfully updated ${beatIds.length} beats as weekly picks:`, beatIds)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated_count: beatIds.length,
          beat_ids: beatIds 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    throw new Error(`Unknown operation: ${operation}`)
    
  } catch (error) {
    console.error('Admin operation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
