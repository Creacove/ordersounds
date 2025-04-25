
// @ts-nocheck
// Audio processing edge function for OrderSOUNDS
// Extracts first 30% of audio file for preview

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceRole || !supabaseAnonKey) {
  console.error("Missing required environment variables");
}

const adminClient = createClient(supabaseUrl, supabaseServiceRole);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
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
    
    const urlObj = new URL(fullTrackUrl);
    const pathParts = urlObj.pathname.split('/');
    let fileName = pathParts[pathParts.length - 1];
    const fileBase = fileName.split('.')[0];
    const outputFileName = `preview_${fileBase}_${Date.now()}.wav`;
    const outputPath = `previews/${outputFileName}`;

    const audioResponse = await fetch(fullTrackUrl);
    
    if (!audioResponse.ok) {
      console.error(`Download failed with status: ${audioResponse.status}`);
      return new Response(
        JSON.stringify({ error: "Failed to download audio file", status: "error" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fileArrayBuffer = await audioResponse.arrayBuffer();
    const totalBytes = fileArrayBuffer.byteLength;
    
    // Take approximately 30% of the file, limit to 3MB for WAV files
    const maxPreviewBytes = 3 * 1024 * 1024;
    const previewBytes = Math.min(Math.floor(totalBytes * 0.3), maxPreviewBytes);
    
    // For WAV files, make sure to include the header
    const hasWavHeader = new Uint8Array(fileArrayBuffer.slice(0, 4)).reduce((acc, byte) => 
      acc + String.fromCharCode(byte), '') === 'RIFF';
    
    let previewBuffer: Uint8Array;
    
    if (hasWavHeader) {
      // Include WAV header (44 bytes) + audio data
      const headerSize = 44;
      previewBuffer = new Uint8Array(fileArrayBuffer.slice(0, headerSize + previewBytes));
      
      // Update WAV header with new size
      const view = new DataView(previewBuffer.buffer);
      view.setUint32(4, 36 + previewBytes, true); // Update RIFF chunk size
      view.setUint32(40, previewBytes, true); // Update data chunk size
    } else {
      // Just take the first part for MP3 files
      previewBuffer = new Uint8Array(fileArrayBuffer.slice(0, previewBytes));
    }
    
    console.log(`Preview size: ${previewBuffer.byteLength} bytes (${(previewBuffer.byteLength / totalBytes * 100).toFixed(1)}%)`);
    
    const { error: uploadError } = await adminClient.storage
      .from('beats')
      .upload(outputPath, previewBuffer, {
        contentType: hasWavHeader ? 'audio/wav' : 'audio/mpeg',
        cacheControl: "3600",
        upsert: true
      });

    if (uploadError) {
      console.error("Error uploading preview file:", uploadError);
      throw new Error("Failed to upload processed audio");
    }

    const { data: publicUrlData } = adminClient.storage
      .from('beats')
      .getPublicUrl(outputPath);
    
    const cacheBustedUrl = `${publicUrlData.publicUrl}?cb=${Date.now()}`;
    
    console.log("Preview uploaded successfully:", cacheBustedUrl);
    
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
        error: "Failed to process audio file",
        status: "error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

