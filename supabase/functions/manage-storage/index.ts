
// File Path: /supabase/functions/manage-storage/index.ts

declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1"
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand 
} from "https://esm.sh/@aws-sdk/client-s3@3.454.0"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.454.0"

const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT');
const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: R2_SECRET_ACCESS_KEY ?? '',
  },
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, userId, fileName, fileType, fileSize, key, size } = await req.json();

    if (action === 'get-upload-url') {
      const fileKey = `${userId}/${Date.now()}-${fileName}`;
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        ContentType: fileType,
        ContentLength: fileSize
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      
      return new Response(JSON.stringify({ url, key: fileKey }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (action === 'confirm-upload') {
      // Perform atomic usage increment
      await supabase.rpc('increment_usage', { 
        u_id: userId, 
        col_name: 'storage_used', 
        amount: size 
      });

      return new Response(JSON.stringify({ success: true }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (action === 'get-download-url') {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return new Response(JSON.stringify({ url }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    throw new Error('Unsupported storage action');

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
