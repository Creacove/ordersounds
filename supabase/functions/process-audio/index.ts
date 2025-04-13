
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

// Use service role key for admin access to storage
const supabase = createClient(supabaseUrl, supabaseServiceRole);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { fullTrackUrl } = await req.json();

    if (!fullTrackUrl) {
      return new Response(
        JSON.stringify({ error: "Missing full track URL" }),
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
    let filePath = pathParts[pathParts.length - 1];
    
    // If the URL contains the bucket name followed by the path, extract just the path
    if (pathParts.includes("beats")) {
      const beatsIndex = pathParts.indexOf("beats");
      filePath = pathParts.slice(beatsIndex + 1).join('/');
    }
    
    console.log(`Extracted file path: ${filePath}`);
    
    // Download the full file data
    const { data: fileData, error: fileError } = await supabase.storage
      .from('beats')
      .download(filePath);

    if (fileError || !fileData) {
      console.error("Error downloading file:", fileError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to download audio file", 
          details: fileError?.message || "File not found or inaccessible" 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the file extension for naming and determine content type
    const fileExt = filePath.split('.').pop().toLowerCase();
    console.log(`File extension: ${fileExt}`);
    
    // Create a unique file name for the preview
    const fileName = crypto.randomUUID();
    const timestamp = Date.now();
    const previewExt = fileExt; // Maintain original file extension
    const uploadPath = `previews/${timestamp}_${fileName}_preview.${previewExt}`;
    
    try {
      // Convert file to array buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const totalBytes = arrayBuffer.byteLength;
      
      // Take only the first 30% of the file for the preview
      const previewBytes = Math.floor(totalBytes * 0.3);
      const previewBuffer = arrayBuffer.slice(0, previewBytes);
      
      console.log(`Total file size: ${totalBytes} bytes, Preview size: ${previewBytes} bytes`);
      
      // Determine the correct content type based on file extension
      let contentType;
      switch (fileExt) {
        case 'wav':
          contentType = 'audio/wav';
          break;
        case 'mp3':
          contentType = 'audio/mpeg';
          break;
        case 'm4a':
          contentType = 'audio/m4a';
          break;
        case 'aac':
          contentType = 'audio/aac';
          break;
        case 'ogg':
          contentType = 'audio/ogg';
          break;
        default:
          contentType = 'audio/mpeg';
      }
      
      // Upload the preview portion to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('beats')
        .upload(uploadPath, new Uint8Array(previewBuffer), {
          contentType: contentType,
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) {
        console.error("Error uploading preview file:", uploadError);
        throw new Error(`Failed to upload processed audio: ${uploadError.message}`);
      }

      // Get the public URL of the uploaded preview
      const { data: publicUrlData } = supabase.storage
        .from('beats')
        .getPublicUrl(uploadPath);
          
      console.log("Preview generated successfully:", publicUrlData.publicUrl);
      
      // Return the preview URL directly in the response
      return new Response(
        JSON.stringify({
          success: true,
          publicUrl: publicUrlData.publicUrl,
          path: uploadPath
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
          details: error.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error processing audio:", error);
    return new Response(
      JSON.stringify({ 
        error: "An error occurred processing the audio file",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
