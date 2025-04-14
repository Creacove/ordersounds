
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
    const { fullTrackUrl, requiresWav } = body;
    
    if (!fullTrackUrl) {
      throw new Error('Full track URL is required');
    }

    console.log(`Processing audio from URL: ${fullTrackUrl}`);
    console.log(`WAV format required: ${requiresWav}`);

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
    
    // Generate a 30-second preview from the audio file
    // This is a simplified example - in a real implementation, you would:
    // 1. Use an audio processing library to trim the file
    // 2. Add a watermark
    // 3. Convert to MP3 if it's not already
    
    // For this example, we'll simulate processing by just uploading the first part
    const fileArrayBuffer = await response.arrayBuffer();
    
    // In a real implementation, you would process the audio here
    // For now, we'll create a smaller version of the file as a mock preview
    // (Take the first 1/4 of the file as a simple simulation)
    const previewSize = Math.floor(fileArrayBuffer.byteLength / 4);
    const previewArrayBuffer = fileArrayBuffer.slice(0, previewSize);
    
    // Upload the preview file
    console.log(`Uploading preview file: ${outputFileName}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('beats')
      .upload(`previews/${outputFileName}`, previewArrayBuffer, {
        contentType: 'audio/mpeg',
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
