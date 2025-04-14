
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Process Audio Function: Started");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed successfully");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON request',
          status: 'error' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { fullTrackUrl } = body;
    
    if (!fullTrackUrl) {
      console.error("Missing fullTrackUrl in request");
      return new Response(
        JSON.stringify({ 
          error: 'Full track URL is required',
          status: 'error' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing audio from URL: ${fullTrackUrl}`);

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ 
          error: 'Missing Supabase environment variables',
          status: 'error' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log("Supabase environment variables found");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract the file name and path from the URL
    const urlParts = new URL(fullTrackUrl);
    const pathParts = urlParts.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const fileBase = fileName.split('.')[0];
    
    const outputFileName = `preview_${fileBase}.mp3`;
    
    // Download the file
    console.log(`Downloading original file: ${fileName}`);
    const response = await fetch(fullTrackUrl);
    if (!response.ok) {
      console.error(`Failed to download file: ${response.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: `Failed to download file: ${response.statusText}`,
          status: 'error' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Get the original file as ArrayBuffer
    console.log("File downloaded, processing...");
    const fileArrayBuffer = await response.arrayBuffer();
    
    // Take first 30% of the file
    const totalSize = fileArrayBuffer.byteLength;
    const previewSize = Math.floor(totalSize * 0.3); // 30% of the original file
    
    console.log(`Original file size: ${totalSize}, Preview size: ${previewSize}`);
    
    // Create the preview from a portion of the original file
    const previewArrayBuffer = fileArrayBuffer.slice(0, previewSize);
    
    // Upload the preview file
    console.log(`Uploading preview file: ${outputFileName}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('beats')
      .upload(`previews/${outputFileName}`, previewArrayBuffer, {
        contentType: 'audio/mpeg', // Always set the content type for audio
        cacheControl: '3600',
        upsert: true // Allow overwriting existing files
      });
    
    if (uploadError) {
      console.error('Error uploading preview file:', uploadError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to upload preview: ${uploadError.message}`,
          status: 'error' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Get the public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from('beats')
      .getPublicUrl(`previews/${outputFileName}`);
    
    console.log(`Preview file generated and uploaded: ${publicUrlData.publicUrl}`);
    
    // Return the URL to the preview file
    return new Response(
      JSON.stringify({ 
        previewUrl: publicUrlData.publicUrl,
        status: 'success' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error processing audio:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        status: 'error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
