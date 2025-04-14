
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
    const body = await req.json();
    const { fullTrackUrl } = body;
    
    if (!fullTrackUrl) {
      throw new Error('Full track URL is required');
    }

    console.log(`Processing audio from URL: ${fullTrackUrl}`);

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
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
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    // Get the content type of the original file
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    console.log(`Original file content type: ${contentType}`);
    
    // Get the file as ArrayBuffer
    const fileArrayBuffer = await response.arrayBuffer();
    
    // Create a preview by taking approximately 30% of the file
    // This is a simplified approach - it's not analyzing the audio, just taking a portion
    const totalSize = fileArrayBuffer.byteLength;
    const previewSize = Math.floor(totalSize * 0.3); // 30% of the original file
    const startOffset = Math.floor(totalSize * 0.1); // Start at 10% to avoid intros
    
    console.log(`Original file size: ${totalSize}, Preview size: ${previewSize}, Start offset: ${startOffset}`);
    
    // Create the preview from a portion of the original file
    const previewArrayBuffer = fileArrayBuffer.slice(startOffset, startOffset + previewSize);
    
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
      throw new Error(`Failed to upload preview: ${uploadError.message}`);
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
        error: error.message,
        status: 'error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
