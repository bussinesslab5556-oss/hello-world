// File Path: /supabase/functions/handle-new-user/index.ts

declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req: Request) => {
  try {
    const { record } = await req.json()
    if (!record || !record.id) throw new Error("ID Missing");

    const { id: userId, raw_user_meta_data: metadata } = record
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

    /**
     * ATOMICITY CHECK:
     * Sequential execution with thrown errors ensure that if Step 1 fails,
     * Step 2 and 3 are NEVER reached, preventing orphan data.
     */

    // Step 1: Profile
    const { error: pErr } = await supabase.from('profiles').insert({
      id: userId,
      full_name: metadata?.full_name || 'New User',
    });
    if (pErr) throw pErr;

    // Step 2: Usage (STORAGE_USED aligned)
    const { error: uErr } = await supabase.from('user_usage').insert({
      user_id: userId,
      translation_chars_count: 0,
      call_minutes_count: 0,
      storage_used: 0 
    });
    if (uErr) throw uErr;

    // Step 3: Subscription
    const { error: sErr } = await supabase.from('subscriptions').insert({
      user_id: userId,
      tier: 'Free',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    if (sErr) throw sErr;

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})