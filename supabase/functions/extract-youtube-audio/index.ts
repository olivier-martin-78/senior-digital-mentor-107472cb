
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-connection-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎵 Starting YouTube audio extraction process...');
    console.log('🔍 Environment check - RAPIDAPI_KEY exists:', !!Deno.env.get('RAPIDAPI_KEY'));
    console.log('🔍 Environment check - SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
    console.log('🔍 Environment check - SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    
    const { youtubeUrl } = await req.json();
    console.log('📋 Request data:', { youtubeUrl });
    
    if (!youtubeUrl) {
      console.error('❌ No YouTube URL provided');
      return new Response(
        JSON.stringify({ error: 'URL YouTube requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire l'ID de la vidéo YouTube
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      console.error('❌ Invalid YouTube URL:', youtubeUrl);
      return new Response(
        JSON.stringify({ error: 'URL YouTube invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Extracted video ID:', videoId);

    // Vérifier la disponibilité de la clé RapidAPI
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      console.error('❌ RapidAPI key not found in environment');
      throw new Error('Clé RapidAPI manquante. Veuillez configurer RAPIDAPI_KEY dans les secrets Supabase.');
    }

    console.log('🔑 RapidAPI key found, proceeding with extraction...');

    // Essayer d'abord l'API RapidAPI principale
    let audioUrl = null;
    let audioBuffer = null;

    try {
      audioUrl = await extractWithRapidAPI(videoId, rapidApiKey);
      console.log('✅ RapidAPI extraction successful:', audioUrl);
    } catch (rapidApiError) {
      console.warn('⚠️ RapidAPI failed, trying alternative method:', rapidApiError.message);
      
      // Essayer une méthode alternative avec une autre API RapidAPI
      try {
        audioUrl = await extractWithAlternativeAPI(videoId, rapidApiKey);
        console.log('✅ Alternative API extraction successful:', audioUrl);
      } catch (altError) {
        console.error('❌ All extraction methods failed:', altError.message);
        throw new Error('Impossible d\'extraire l\'audio de cette vidéo. Les services d\'extraction sont temporairement indisponibles.');
      }
    }

    if (!audioUrl) {
      throw new Error('Aucune URL audio générée par les services d\'extraction');
    }

    // Télécharger le fichier audio
    console.log('📥 Downloading audio file from:', audioUrl);
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      console.error('❌ Failed to download audio:', audioResponse.status, audioResponse.statusText);
      throw new Error(`Impossible de télécharger le fichier audio (${audioResponse.status})`);
    }

    audioBuffer = await audioResponse.arrayBuffer();
    console.log('📦 Audio downloaded, size:', audioBuffer.byteLength, 'bytes');

    if (audioBuffer.byteLength === 0) {
      throw new Error('Le fichier audio téléchargé est vide');
    }

    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Générer un nom de fichier unique
    const fileName = `youtube_audio_${videoId}_${Date.now()}.mp3`;
    const filePath = `audio/${fileName}`;

    console.log('☁️ Uploading to Supabase storage:', filePath);

    // Uploader le fichier dans le bucket Supabase
    const { error: uploadError } = await supabase.storage
      .from('activity-thumbnails')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('activity-thumbnails')
      .getPublicUrl(filePath);

    console.log('🎉 Audio extraction completed successfully!');
    console.log('📁 File stored at:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioUrl: publicUrl,
        fileName: fileName,
        videoId: videoId,
        fileSize: audioBuffer.byteLength
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Fatal error in extract-youtube-audio:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de l\'extraction audio',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Fonction d'extraction avec l'API RapidAPI principale
async function extractWithRapidAPI(videoId: string, rapidApiKey: string): Promise<string> {
  const apiUrl = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;
  console.log('🔗 Calling RapidAPI:', apiUrl);
  
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
    }
  });

  console.log('📡 RapidAPI response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ RapidAPI error response:', errorText);
    throw new Error(`RapidAPI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('📋 RapidAPI response data:', data);
  
  if (data.status !== 'ok' || !data.link) {
    throw new Error(`RapidAPI extraction failed: ${data.msg || 'Unknown error'}`);
  }

  return data.link;
}

// Fonction d'extraction avec une API alternative
async function extractWithAlternativeAPI(videoId: string, rapidApiKey: string): Promise<string> {
  // Utiliser une API alternative comme youtube-mp3-downloader
  const apiUrl = `https://youtube-mp3-downloader.p.rapidapi.com/dl?id=${videoId}`;
  console.log('🔗 Calling alternative API:', apiUrl);
  
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': 'youtube-mp3-downloader.p.rapidapi.com'
    }
  });

  console.log('📡 Alternative API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Alternative API error response:', errorText);
    throw new Error(`Alternative API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('📋 Alternative API response data:', data);
  
  if (!data.link && !data.downloadUrl && !data.url) {
    throw new Error('Alternative API: No download link found');
  }

  return data.link || data.downloadUrl || data.url;
}

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
}
