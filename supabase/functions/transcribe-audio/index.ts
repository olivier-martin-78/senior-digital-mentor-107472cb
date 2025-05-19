
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  try {
    console.log(`Processing base64 string of length: ${base64String.length}`);
    
    const chunks: Uint8Array[] = [];
    let position = 0;
    
    while (position < base64String.length) {
      const chunk = base64String.slice(position, position + chunkSize);
      const binaryChunk = atob(chunk);
      const bytes = new Uint8Array(binaryChunk.length);
      
      for (let i = 0; i < binaryChunk.length; i++) {
        bytes[i] = binaryChunk.charCodeAt(i);
      }
      
      chunks.push(bytes);
      position += chunkSize;
      console.log(`Processed chunk ${chunks.length}, position: ${position}/${base64String.length}`);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    console.log(`Successfully processed ${chunks.length} chunks, total length: ${totalLength}`);
    return result;
  } catch (error) {
    console.error("Error processing base64 chunks:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Received transcribe audio request");
    
    const requestData = await req.json();
    const { audio } = requestData;
    
    if (!audio) {
      console.error("No audio data provided");
      return new Response(
        JSON.stringify({ error: 'No audio data provided', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Received audio data of length: ${audio.length}`);
    
    // Check if OpenAI API key is present
    const openai_api_key = Deno.env.get('OPENAI_API_KEY');
    if (!openai_api_key) {
      console.error("OPENAI_API_KEY environment variable not set");
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log("Processing audio in chunks");
    
    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    
    console.log("Creating form data");
    
    // Prepare form data
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log("Sending request to OpenAI");
    
    // Send to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openai_api_key}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} ${errorText}`);
      return new Response(
        JSON.stringify({ error: `OpenAI API error ${response.status}: ${errorText}`, success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    console.log("Received successful response from OpenAI");
    const result = await response.json();
    console.log("Transcription result:", result);

    return new Response(
      JSON.stringify({ text: result.text, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Transcription error:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
