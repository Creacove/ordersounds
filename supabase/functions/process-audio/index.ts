
// @ts-nocheck
// Audio processing edge function for OrderSOUNDS
// Simply extracts first 30% of audio file for preview

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
// Not used anymore, but kept for compatibility with old code
const publicClient = createClient(supabaseUrl, supabaseAnonKey);

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
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'mp3';
    
    // For better browser compatibility, always generate MP3 previews regardless of source format
    const outputFileName = `preview_${fileBase}_${Date.now()}.mp3`;
    
    console.log(`Extracted file name: ${fileName}, Output: ${outputFileName}`);
    
    // Download the full file data
    console.log(`Downloading audio from: ${fullTrackUrl}`);
    const audioResponse = await fetch(fullTrackUrl);
    
    if (!audioResponse.ok) {
      console.error(`Download failed with status: ${audioResponse.status}`);
      return new Response(
        JSON.stringify({ 
          error: `Failed to download audio file: ${audioResponse.statusText}`,
          details: `Status code: ${audioResponse.status}`,
          status: "error" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the file content
    const fileArrayBuffer = await audioResponse.arrayBuffer();
    const totalBytes = fileArrayBuffer.byteLength;
    
    // Make sure we're generating a preview that's not too small
    // Take either 30% of the file or at least 500KB to ensure we have enough audio data
    const minPreviewBytes = 500 * 1024; // 500KB minimum
    const thirtyPercent = Math.floor(totalBytes * 0.3);
    const previewBytes = Math.max(thirtyPercent, minPreviewBytes);
    
    // But don't exceed the original file size
    const finalPreviewBytes = Math.min(previewBytes, totalBytes);
    
    // Take the preview segment from the file
    const previewBuffer = fileArrayBuffer.slice(0, finalPreviewBytes);
    
    // Convert ArrayBuffer to Uint8Array for Supabase upload
    const previewArray = new Uint8Array(previewBuffer);
    
    console.log(`Total file size: ${totalBytes} bytes, Preview size: ${previewArray.byteLength} bytes (${(previewArray.byteLength / totalBytes * 100).toFixed(1)}%)`);
    
    // Get MIME type - always use MP3 for previews for browser compatibility
    const contentType = 'audio/mpeg';
    console.log(`Using content type: ${contentType} for preview`);
    
    // Upload the preview portion to storage - using service role to bypass RLS
    console.log(`Uploading preview file: previews/${outputFileName}`);
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('beats')
      .upload(`previews/${outputFileName}`, previewArray, {
        contentType: contentType,
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
      .getPublicUrl(`previews/${outputFileName}`);
        
    console.log("Preview uploaded successfully:", publicUrlData.publicUrl);
    
    // Return the preview URL directly in the response
    return new Response(
      JSON.stringify({
        success: true,
        previewUrl: publicUrlData.publicUrl,
        path: `previews/${outputFileName}`,
        previewBytes: previewArray.byteLength,
        totalBytes: totalBytes,
        previewRatio: (previewArray.byteLength / totalBytes * 100).toFixed(1) + '%',
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

/**
 * Get MIME type from file extension
 * @param ext File extension
 * @returns MIME type string
 */
function getMimeType(ext: string): string {
  const map: {[key: string]: string} = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    
    // Archives
    zip: 'application/zip',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  
  return map[ext.toLowerCase()] || 'application/octet-stream';
}
