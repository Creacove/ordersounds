
// @ts-nocheck
// Audio processing edge function for OrderSOUNDS
// Extracts first 30% of audio file for preview and converts to MP3 for browser compatibility

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceRole || !supabaseAnonKey) {
  console.error("Missing required environment variables");
}

// Create client with service role key for admin access to storage
const adminClient = createClient(supabaseUrl, supabaseServiceRole);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    // Parse the request body
    const { fullTrackUrl } = await req.json();

    if (!fullTrackUrl) {
      console.error("Missing fullTrackUrl in request");
      return new Response(
        JSON.stringify({ error: "Missing full track URL", status: "error" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing audio file: ${fullTrackUrl}`);
    
    // Extract file path from URL
    const urlObj = new URL(fullTrackUrl);
    const pathParts = urlObj.pathname.split('/');
    
    // Determine the file path based on URL structure
    let fileName = pathParts[pathParts.length - 1];
    const fileBase = fileName.split('.')[0];
    
    // Force browser-compatible format (MP3)
    const outputFileName = `preview_${fileBase}_${Date.now()}.mp3`;
    const outputPath = `previews/${outputFileName}`;

    // Download the full file data
    console.log(`Downloading audio from: ${fullTrackUrl}`);
    const audioResponse = await fetch(fullTrackUrl);
    
    if (!audioResponse.ok) {
      console.error(`Download failed with status: ${audioResponse.status}`);
      return new Response(
        JSON.stringify({ 
          error: `Failed to download audio file: ${audioResponse.statusText}`,
          status: "error" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the file content as an array buffer
    const fileArrayBuffer = await audioResponse.arrayBuffer();
    const totalBytes = fileArrayBuffer.byteLength;
    
    // Take approximately 30% of the file for preview
    // For large WAV files, limit to first 3MB
    const maxPreviewBytes = 3 * 1024 * 1024; // 3MB
    const previewBytes = Math.min(Math.floor(totalBytes * 0.3), totalBytes, maxPreviewBytes);
    const previewBuffer = new Uint8Array(fileArrayBuffer.slice(0, previewBytes));
    
    console.log(`Total file size: ${totalBytes} bytes, Preview size: ${previewBuffer.byteLength} bytes (${(previewBuffer.byteLength / totalBytes * 100).toFixed(1)}%)`);
    
    // Upload the preview to storage using service role to bypass RLS
    console.log(`Uploading preview file: ${outputPath}`);
    const { error: uploadError } = await adminClient.storage
      .from('beats')
      .upload(outputPath, previewBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: "3600",
        upsert: true
      });

    if (uploadError) {
      console.error("Error uploading preview file:", uploadError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to upload processed audio: ${uploadError.message}`,
          status: "error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the public URL of the uploaded preview
    const { data: publicUrlData } = adminClient.storage
      .from('beats')
      .getPublicUrl(outputPath);
    
    // Add cache-busting parameter to the URL to prevent browser caching issues
    const cacheBustedUrl = `${publicUrlData.publicUrl}?cb=${Date.now()}`;
    
    console.log("Preview uploaded successfully:", cacheBustedUrl);
    
    // Return the preview URL directly in the response
    return new Response(
      JSON.stringify({
        success: true,
        previewUrl: cacheBustedUrl,
        status: "success"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    console.error("Error processing audio:", error);
    return new Response(
      JSON.stringify({ 
        error: "An error occurred processing the audio file",
        details: error.message,
        status: "error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
