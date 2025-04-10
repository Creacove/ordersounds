
// @ts-nocheck
// Audio processing edge function for OrderSOUNDS
// Converts WAV files to MP3, extracts previews, and adds watermarks

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supabase client setup
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") as string;
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { fullTrackUrl, requiresWav = false } = await req.json();

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
    console.log(`Requires WAV: ${requiresWav}`);

    // Extract file path from URL
    const urlObj = new URL(fullTrackUrl);
    const pathParts = urlObj.pathname.split('/');
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

    if (fileError) {
      console.error("Error downloading file:", fileError);
      return new Response(
        JSON.stringify({ error: "Failed to download audio file", details: fileError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get file extension
    const fileExt = filePath.split('.').pop().toLowerCase();
    console.log(`File extension: ${fileExt}`);

    // Set up file handlers and temporary storage
    const fileName = crypto.randomUUID();
    const inputPath = `${fileName}.${fileExt}`;
    const mp3Path = `${fileName}.mp3`;
    const previewPath = `${fileName}_preview.mp3`;
    const watermarkedPath = `${fileName}_watermarked.mp3`;

    // Write input file to disk
    await Deno.writeFile(inputPath, new Uint8Array(await fileData.arrayBuffer()));
    console.log("Successfully wrote input file to disk");

    try {
      // Validate the input file using ffprobe
      const validateCmd = new Deno.Command("ffprobe", {
        args: [
          "-v", "error",
          "-show_entries", "format=duration",
          "-of", "default=noprint_wrappers=1:nokey=1",
          inputPath
        ]
      });
      
      const validateResult = await validateCmd.output();
      if (!validateResult.success) {
        console.error("File validation failed");
        throw new Error("Invalid audio file. Please upload a valid audio file.");
      }
      
      console.log("File validation successful");
    } catch (error) {
      console.error("Error validating audio file:", error);
      return new Response(
        JSON.stringify({ error: "Invalid audio file. Please upload a valid audio file.", details: error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Convert WAV to MP3 if needed
    if (fileExt === 'wav') {
      try {
        console.log("Converting WAV to MP3");
        const ffmpegCmd = new Deno.Command("ffmpeg", {
          args: [
            "-i", inputPath,
            "-vn", "-ar", "44100", "-ac", "2", "-b:a", "192k",
            mp3Path
          ]
        });
        const { success, stdout, stderr } = await ffmpegCmd.output();
        
        if (!success) {
          console.error("WAV to MP3 conversion failed");
          throw new Error("Failed to convert WAV to MP3");
        }
        console.log("Successfully converted WAV to MP3");
      } catch (error) {
        console.error("Error converting WAV to MP3:", error);
        return new Response(
          JSON.stringify({ error: "Failed to process audio file - conversion error", details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Just rename the file if it's already an MP3
      await Deno.copyFile(inputPath, mp3Path);
      console.log("Using existing MP3 file");
    }

    // Extract 30-second preview
    try {
      console.log("Extracting 30-second preview");
      const previewCmd = new Deno.Command("ffmpeg", {
        args: [
          "-i", mp3Path,
          "-ss", "0", "-t", "30",
          previewPath
        ]
      });
      const { success } = await previewCmd.output();
      
      if (!success) {
        console.error("Preview extraction failed");
        throw new Error("Failed to extract preview");
      }
      console.log("Successfully extracted 30-second preview");
    } catch (error) {
      console.error("Error extracting preview:", error);
      return new Response(
        JSON.stringify({ error: "Failed to process audio file - preview extraction error", details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Add watermark (if watermark file exists)
    let finalPreviewFile;
    try {
      console.log("Checking for watermark file");
      const { data: watermarkData, error: watermarkError } = await supabase.storage
        .from('audio')
        .download('watermark.mp3');

      if (watermarkError) {
        console.warn("No watermark file found, using preview without watermark");
        finalPreviewFile = previewPath;
      } else {
        // Write watermark file to disk
        await Deno.writeFile("watermark.mp3", new Uint8Array(await watermarkData.arrayBuffer()));
        console.log("Watermark file downloaded");
        
        // Add watermark to the preview
        console.log("Adding watermark to preview");
        const watermarkCmd = new Deno.Command("ffmpeg", {
          args: [
            "-i", previewPath,
            "-i", "watermark.mp3",
            "-filter_complex", "[0:0][1:0]concat=n=2:v=0:a=1[out]",
            "-map", "[out]",
            watermarkedPath
          ]
        });
        const { success } = await watermarkCmd.output();
        
        if (!success) {
          console.error("Watermark application failed");
          throw new Error("Failed to add watermark");
        }
        
        finalPreviewFile = watermarkedPath;
        console.log("Successfully added watermark");
      }
    } catch (error) {
      console.error("Error adding watermark:", error);
      finalPreviewFile = previewPath;
      console.log("Using preview without watermark due to error:", error.message);
    }

    // Upload the processed preview to Supabase Storage
    console.log("Uploading processed preview");
    const previewFileBuffer = await Deno.readFile(finalPreviewFile);
    const uploadPath = `previews/${Date.now()}_${fileName}_preview.mp3`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('beats')
      .upload(uploadPath, previewFileBuffer, {
        contentType: "audio/mpeg",
        cacheControl: "3600"
      });

    if (uploadError) {
      console.error("Error uploading preview file:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload processed audio", details: uploadError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the public URL of the uploaded preview
    const { data: publicUrlData } = supabase.storage
      .from('beats')
      .getPublicUrl(uploadData.path);
      
    console.log("Preview uploaded successfully:", publicUrlData.publicUrl);

    // Clean up temporary files
    try {
      await Deno.remove(inputPath);
      await Deno.remove(mp3Path);
      await Deno.remove(previewPath);
      if (finalPreviewFile === watermarkedPath) {
        await Deno.remove(watermarkedPath);
      }
      if (await Deno.stat("watermark.mp3").catch(() => null)) {
        await Deno.remove("watermark.mp3");
      }
      console.log("Temporary files cleaned up");
    } catch (error) {
      console.error("Error cleaning up temporary files:", error);
    }

    // Return success response with preview URL
    return new Response(
      JSON.stringify({ 
        success: true, 
        previewUrl: uploadData.path,
        publicUrl: publicUrlData.publicUrl
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
});
