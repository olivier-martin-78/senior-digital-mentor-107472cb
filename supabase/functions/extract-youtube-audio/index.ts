
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

    // Essayer plusieurs services gratuits
    let audioUrl = null;
    let audioBuffer = null;

    try {
      // Essayer le service gratuit YT1s
      audioUrl = await extractWithYT1s(videoId);
      console.log('✅ YT1s extraction successful:', audioUrl);
    } catch (yt1sError) {
      console.warn('⚠️ YT1s failed, trying alternative method:', yt1sError.message);
      
      try {
        // Essayer le service gratuit Y2mate
        audioUrl = await extractWithY2mate(videoId);
        console.log('✅ Y2mate extraction successful:', audioUrl);
      } catch (y2mateError) {
        console.warn('⚠️ Y2mate failed, trying cobalt.tools:', y2mateError.message);
        
        try {
          // Essayer cobalt.tools comme dernière option
          audioUrl = await extractWithCobalt(youtubeUrl);
          console.log('✅ Cobalt extraction successful:', audioUrl);
        } catch (cobaltError) {
          console.error('❌ All extraction methods failed:', cobaltError.message);
          throw new Error('Tous les services d\'extraction gratuits sont temporairement indisponibles. Veuillez réessayer plus tard ou utiliser l\'upload manuel.');
        }
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
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error name:', error.name);
    console.error('💥 Error message:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de l\'extraction audio',
        details: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Service gratuit YT1s
async function extractWithYT1s(videoId: string): Promise<string> {
  console.log('🔗 Calling YT1s API for video:', videoId);
  
  // Première étape : obtenir les informations de la vidéo
  const infoResponse = await fetch('https://yt1s.com/api/ajaxSearch/index', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `q=https://www.youtube.com/watch?v=${videoId}&vt=home`
  });

  if (!infoResponse.ok) {
    throw new Error(`YT1s info request failed: ${infoResponse.status}`);
  }

  const infoData = await infoResponse.json();
  console.log('📋 YT1s info response:', infoData);

  if (infoData.status !== 'ok' || !infoData.links || !infoData.links.mp3) {
    throw new Error('YT1s: No MP3 links found');
  }

  // Prendre le premier lien MP3 disponible (généralement 128kbps)
  const mp3Links = infoData.links.mp3;
  const firstMp3Key = Object.keys(mp3Links)[0];
  const mp3Info = mp3Links[firstMp3Key];

  if (!mp3Info || !mp3Info.k) {
    throw new Error('YT1s: No valid MP3 conversion key found');
  }

  // Deuxième étape : convertir et obtenir le lien de téléchargement
  const convertResponse = await fetch('https://yt1s.com/api/ajaxConvert/index', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `vid=${videoId}&k=${mp3Info.k}`
  });

  if (!convertResponse.ok) {
    throw new Error(`YT1s convert request failed: ${convertResponse.status}`);
  }

  const convertData = await convertResponse.json();
  console.log('📋 YT1s convert response:', convertData);

  if (convertData.status !== 'ok' || !convertData.dlink) {
    throw new Error('YT1s: Conversion failed or no download link');
  }

  return convertData.dlink;
}

// Service gratuit Y2mate
async function extractWithY2mate(videoId: string): Promise<string> {
  console.log('🔗 Calling Y2mate API for video:', videoId);
  
  const response = await fetch('https://www.y2mate.com/mates/analyzeV2/ajax', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `k_query=https://www.youtube.com/watch?v=${videoId}&k_page=home&hl=en&q_auto=0`
  });

  if (!response.ok) {
    throw new Error(`Y2mate request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('📋 Y2mate response:', data);

  if (data.status !== 'ok' || !data.links || !data.links.mp3) {
    throw new Error('Y2mate: No MP3 links found');
  }

  // Prendre le premier lien MP3 disponible
  const mp3Links = data.links.mp3;
  const firstMp3Key = Object.keys(mp3Links)[0];
  const mp3Info = mp3Links[firstMp3Key];

  if (!mp3Info || !mp3Info.k) {
    throw new Error('Y2mate: No valid MP3 conversion key found');
  }

  // Convertir
  const convertResponse = await fetch('https://www.y2mate.com/mates/convertV2/index', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `vid=${videoId}&k=${mp3Info.k}`
  });

  if (!convertResponse.ok) {
    throw new Error(`Y2mate convert failed: ${convertResponse.status}`);
  }

  const convertData = await convertResponse.json();
  console.log('📋 Y2mate convert response:', convertData);

  if (convertData.status !== 'ok' || !convertData.dlink) {
    throw new Error('Y2mate: Conversion failed');
  }

  return convertData.dlink;
}

// Service gratuit Cobalt.tools
async function extractWithCobalt(youtubeUrl: string): Promise<string> {
  console.log('🔗 Calling Cobalt API for URL:', youtubeUrl);
  
  const response = await fetch('https://api.cobalt.tools/api/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      url: youtubeUrl,
      quality: '128',
      format: 'mp3',
      filenamePattern: 'basic'
    })
  });

  if (!response.ok) {
    throw new Error(`Cobalt request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('📋 Cobalt response:', data);

  if (data.status !== 'stream' && data.status !== 'success') {
    throw new Error(`Cobalt: ${data.text || 'Unknown error'}`);
  }

  if (!data.url) {
    throw new Error('Cobalt: No download URL provided');
  }

  return data.url;
}

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
}
