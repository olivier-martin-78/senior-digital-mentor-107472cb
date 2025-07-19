import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { youtubeUrl } = await req.json();
    
    if (!youtubeUrl) {
      return new Response(
        JSON.stringify({ error: 'URL YouTube requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire l'ID de la vidéo YouTube
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'URL YouTube invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extraction audio pour la vidéo:', videoId);

    // Utiliser l'API RapidAPI YouTube to MP3 pour l'extraction
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      throw new Error('Clé RapidAPI manquante');
    }

    // Appel à l'API d'extraction audio avec URL correctement construite
    const apiUrl = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;
    console.log('Appel API RapidAPI avec URL:', apiUrl);
    
    const extractionResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
      }
    });

    if (!extractionResponse.ok) {
      throw new Error('Erreur lors de l\'extraction audio');
    }

    const extractionData = await extractionResponse.json();
    
    if (extractionData.status !== 'ok' || !extractionData.link) {
      throw new Error('Impossible d\'extraire l\'audio de cette vidéo');
    }

    // Télécharger le fichier audio
    const audioResponse = await fetch(extractionData.link);
    if (!audioResponse.ok) {
      throw new Error('Impossible de télécharger le fichier audio');
    }

    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();

    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Générer un nom de fichier unique
    const fileName = `audio_${videoId}_${Date.now()}.mp3`;
    const filePath = `audio/${fileName}`;

    // Uploader le fichier dans le bucket Supabase
    const { error: uploadError } = await supabase.storage
      .from('activity-thumbnails')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur upload:', uploadError);
      throw new Error('Erreur lors de l\'upload du fichier audio');
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('activity-thumbnails')
      .getPublicUrl(filePath);

    console.log('Audio extrait et stocké avec succès:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioUrl: publicUrl,
        fileName: fileName,
        videoId: videoId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erreur dans extract-youtube-audio:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de l\'extraction audio',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
}