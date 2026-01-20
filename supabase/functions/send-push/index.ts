
// File Path: /supabase/functions/send-push/index.ts

declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1"

const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID');
const FIREBASE_MESSAGING_KEY = Deno.env.get('FIREBASE_MESSAGING_KEY'); // Service Account Key or OAuth Token

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // This function is intended to be called by a Supabase Webhook on `messages` INSERT
    const { record } = await req.json();
    const { chat_id, sender_id, content } = record;

    // 1. Get Chat Participants (to find the receiver)
    // For this implementation, we assume a simple p2p chat lookup or a chats_members table
    const { data: senderProfile } = await supabase.from('profiles').select('full_name').eq('id', sender_id).single();
    
    // 2. Fetch Receiver Devices
    // logic: find users in chat_id where user_id != sender_id
    // For now, we mock the receiver lookup
    const receiverId = "target_user_id"; 

    const { data: devices } = await supabase
      .from('user_devices')
      .select('fcm_token, platform')
      .eq('user_id', receiverId);

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ status: 'no_devices' }), { headers: corsHeaders });
    }

    // 3. Construct Notification Payload
    const title = senderProfile?.full_name || 'New Message';
    const body = content.length > 100 ? content.substring(0, 97) + '...' : content;

    // 4. Send via Firebase REST API (v1)
    const results = await Promise.all(devices.map(async (device) => {
      const fcmUrl = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;
      
      const message = {
        message: {
          token: device.fcm_token,
          notification: {
            title: title,
            body: body,
          },
          data: {
            chatId: chat_id,
            click_action: 'FLUTTER_NOTIFICATION_CLICK', // or web equivalent
          },
          webpush: {
            notification: {
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              actions: [
                { action: 'view', title: 'View Chat' },
                { action: 'reply', title: 'Reply' }
              ]
            }
          }
        }
      };

      const res = await fetch(fcmUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('FCM_ACCESS_TOKEN')}`, // Needs to be an OAuth2 token
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return res.ok;
    }));

    return new Response(JSON.stringify({ success: true, delivered: results.filter(r => r).length }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
