
// File Path: /supabase/functions/manage-100ms-room/index.ts

declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const HMS_ACCESS_KEY = Deno.env.get('HMS_ACCESS_KEY');
const HMS_SECRET = Deno.env.get('HMS_SECRET');
const HMS_ENDPOINT = 'https://api.100ms.live/v2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, roomId, userId, role, type } = await req.json();

    if (action === 'create') {
      // Logic to create a room in 100ms
      // 100ms requires an Management Token (JWT) to call their REST API
      // For this implementation, we assume a helper generates the management token
      
      const res = await fetch(`${HMS_ENDPOINT}/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await generateManagementToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `neural-session-${userId}-${Date.now()}`,
          description: `AI ${type} Call`,
          template_id: type === 'video' ? Deno.env.get('HMS_VIDEO_TEMPLATE_ID') : Deno.env.get('HMS_AUDIO_TEMPLATE_ID'),
        }),
      });

      const data = await res.json();
      return new Response(JSON.stringify({ roomId: data.id }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (action === 'join') {
      // Return a client-side join token
      // Usually calls 100ms Token Endpoint
      const res = await fetch(`${HMS_ENDPOINT}/rooms/${roomId}/auth-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await generateManagementToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, role }),
      });

      const data = await res.json();
      return new Response(JSON.stringify({ token: data.token }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    throw new Error('Invalid Action');

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})

/**
 * Mock Management Token Generator
 * In production, this would use a JWT library to sign a token with HMS_SECRET.
 */
async function generateManagementToken() {
  // This is a simplified placeholder for the JWT signing logic required by 100ms
  return "hms_management_token_placeholder";
}
