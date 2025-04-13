
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
    
    // Check if file exists in storage
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

    // Get file extension
    const fileExt = filePath.split('.').pop().toLowerCase();
    console.log(`File extension: ${fileExt}`);

    // Set up temporary file paths with /tmp prefix for Deno Deploy
    const fileName = crypto.randomUUID();
    const inputPath = `/tmp/${fileName}.${fileExt}`;
    const previewPath = `/tmp/${fileName}_preview.mp3`;
    const timestamp = Date.now();
    const uploadPath = `previews/${timestamp}_${fileName}_preview.mp3`;

    try {
      // Write input file to disk
      await Deno.writeFile(inputPath, new Uint8Array(await fileData.arrayBuffer()));
      console.log("Successfully wrote input file to disk");

      // Extract 30% of the file for preview (max 30 seconds)
      try {
        console.log("Extracting preview");
        
        // First get the duration of the file
        const durationCmd = new Deno.Command("ffprobe", {
          args: [
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            inputPath
          ]
        });
        
        const durationResult = await durationCmd.output();
        if (!durationResult.success) {
          throw new Error("Failed to get file duration");
        }
        
        const durationOutput = new TextDecoder().decode(durationResult.stdout).trim();
        const totalDuration = parseFloat(durationOutput);
        console.log(`Total duration: ${totalDuration} seconds`);
        
        // Calculate preview duration (30% of total, max 30 seconds)
        const previewDuration = Math.min(totalDuration * 0.3, 30);
        console.log(`Preview duration: ${previewDuration} seconds`);
        
        // Extract the preview
        const previewCmd = new Deno.Command("ffmpeg", {
          args: [
            "-i", inputPath,
            "-t", previewDuration.toString(),
            "-acodec", "libmp3lame",
            "-q:a", "2",
            previewPath
          ]
        });
        
        const previewResult = await previewCmd.output();
        if (!previewResult.success) {
          throw new Error("Failed to extract preview");
        }
        
        console.log("Successfully extracted preview");
      } catch (error) {
        console.error("Error extracting preview:", error);
        throw new Error(`Failed to extract preview: ${error.message}`);
      }

      // Upload the processed preview to Supabase Storage
      console.log("Uploading processed preview");
      const previewFileBuffer = await Deno.readFile(previewPath);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('beats')
        .upload(uploadPath, previewFileBuffer, {
          contentType: "audio/mpeg",
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
          
      console.log("Preview uploaded successfully:", publicUrlData.publicUrl);
      
      // Clean up temporary files
      try {
        await Deno.remove(inputPath);
        await Deno.remove(previewPath);
        console.log("Temporary files cleaned up");
      } catch (cleanupError) {
        console.error("Error cleaning up temporary files:", cleanupError);
        // Continue despite cleanup errors
      }
      
      // Return the preview URL directly in the response
      return new Response(
        JSON.stringify({
          success: true,
          previewUrl: publicUrlData.publicUrl,
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
