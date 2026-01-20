
// File Path: /supabase/functions/translate-message/index.ts

declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1"

const TRANSLATION_LIMITS: Record<string, number> = {
  'Free': 2000000,
  'Premium': 5000000,
  'Pro': Number.MAX_SAFE_INTEGER,
  'Business': Number.MAX_SAFE_INTEGER,
};

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

    const { text, targetLanguage, userId } = await req.json();
    const charCount = text.length;

    // 1. QUOTA GUARD
    const [usageRes, subRes] = await Promise.all([
      supabase.from('user_usage').select('translation_chars_count').eq('user_id', userId).single(),
      supabase.from('subscriptions').select('tier').eq('user_id', userId).eq('status', 'active').maybeSingle()
    ]);

    const tier = (subRes.data?.tier as string) || 'Free';
    const limit = TRANSLATION_LIMITS[tier];
    const currentUsage = Number(usageRes.data?.translation_chars_count || 0);

    if (currentUsage + charCount > limit) {
      return new Response(JSON.stringify({ error: 'Quota Exceeded' }), { status: 402, headers: corsHeaders });
    }

    // 2. CACHE CHECK (Cost Optimization)
    const { data: cacheData } = await supabase
      .from('translation_cache')
      .select('translated_text')
      .eq('source_text', text)
      .eq('target_lang', targetLanguage)
      .maybeSingle();

    let translatedText = cacheData?.translated_text;

    if (!translatedText) {
      // 3. AZURE API CALL
      const azureKey = Deno.env.get('AZURE_TRANSLATOR_KEY');
      const azureUrl = `${Deno.env.get('AZURE_TRANSLATOR_ENDPOINT')}/translate?api-version=3.0&to=${targetLanguage}`;

      const azureRes = await fetch(azureUrl, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey ?? '',
          'Ocp-Apim-Subscription-Region': Deno.env.get('AZURE_TRANSLATOR_REGION') ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ text }]),
      });

      if (!azureRes.ok) throw new Error('Azure API Failure');
      const translations = await azureRes.json();
      translatedText = translations[0].translations[0].text;

      // Save to Cache
      await supabase.from('translation_cache').insert({
        source_text: text,
        target_lang: targetLanguage,
        translated_text: translatedText
      }).select();
    }

    // 4. ATOMIC USAGE INCREMENT
    await supabase.rpc('increment_usage', { 
      u_id: userId, 
      col_name: 'translation_chars_count', 
      amount: charCount 
    });

    return new Response(JSON.stringify({ translatedText }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
