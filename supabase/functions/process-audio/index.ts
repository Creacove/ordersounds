
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Process Audio Function: Started");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { fullTrackUrl } = body;

    if (!fullTrackUrl) {
      console.error("Missing fullTrackUrl in request");
      return new Response(JSON.stringify({ error: 'Missing fullTrackUrl', status: 'error' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase environment variables', status: 'error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(fullTrackUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const fileBase = fileName.split('.')[0];
    const fileExt = fileName.split('.').pop() || 'mp3';
    const outputFileName = `preview_${fileBase}.${fileExt}`;

    console.log(`Downloading: ${fullTrackUrl}`);
    const audioResponse = await fetch(fullTrackUrl);
    if (!audioResponse.ok) {
      throw new Error(`Download failed: ${audioResponse.statusText}`);
    }

    const fileArrayBuffer = await audioResponse.arrayBuffer();
    const totalSize = fileArrayBuffer.byteLength;
    const previewSize = Math.floor(totalSize * 0.3);

    console.log(`File size: ${totalSize}, preview size: ${previewSize}`);

    const previewBuffer = fileArrayBuffer.slice(0, previewSize);
    const previewBlob = new Blob([previewBuffer], { type: getMimeType(fileExt) });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('beats')
      .upload(`previews/${outputFileName}`, previewBlob, {
        contentType: getMimeType(fileExt),
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage.from('beats').getPublicUrl(`previews/${outputFileName}`);
    console.log(`Preview uploaded to: ${publicUrlData.publicUrl}`);

    return new Response(JSON.stringify({ status: 'success', previewUrl: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 // Explicitly set a 200 status code
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error', status: 'error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getMimeType(ext) {
  const map = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    ogg: 'audio/ogg'
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}
