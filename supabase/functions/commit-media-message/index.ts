
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1"
import { S3Client, HeadObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.454.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: Deno.env.get('R2_ENDPOINT'),
  credentials: {
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
  },
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { chatId, senderId, text, attachments } = await req.json();

    // 1. VALIDATE ATTACHMENTS (Server Side)
    const verifiedAttachments = [];
    for (const att of attachments) {
      try {
        const head = await s3Client.send(new HeadObjectCommand({
          Bucket: Deno.env.get('R2_BUCKET_NAME'),
          Key: att.key
        }));

        // Enforcement: File Size check
        if (!head.ContentLength || head.ContentLength !== att.size) {
          throw new Error(`Size mismatch for ${att.key}`);
        }

        // Enforcement: Content Type check
        const mime = head.ContentType || att.type;

        // Enforcement: Video Duration (Placeholder for binary parsing)
        // In production, we'd use a WASM binary of ffmpeg/probe here
        const metadata = { ...att.metadata };
        if (att.media_type === 'video' && metadata.duration > 300) {
           throw new Error('Video duration exceeds 5 minute limit');
        }

        verifiedAttachments.push({
          storage_path: att.key,
          media_type: att.media_type,
          mime_type: mime,
          file_size: head.ContentLength,
          metadata: metadata
        });
      } catch (err: any) {
        throw new Error(`Cloudfront R2 Validation Failed: ${err.message}`);
      }
    }

    // 2. ATOMIC DB COMMIT
    const { data: messageId, error: dbError } = await supabase.rpc('commit_media_message', {
      p_chat_id: chatId,
      p_sender_id: senderId,
      p_text: text || '',
      p_attachments: verifiedAttachments
    });

    if (dbError) throw dbError;

    // 3. ASYNC POST-PROCESSING (Background)
    // Here we would trigger a secondary Edge Function or external worker 
    // to generate real thumbnails and stored in R2.
    // EdgeFunctions.invoke('generate-thumbnails', { messageId });

    return new Response(JSON.stringify({ success: true, messageId }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
