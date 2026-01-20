
import { useState, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TranslationRequest, TranslationResponse } from '../../../packages/types/translation.ts';

// Guarded singleton pattern for Supabase client to prevent "URL required" crash
let supabaseInstance: SupabaseClient | null = null;

const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  const env = typeof process !== 'undefined' ? process.env : {};
  const url = (env.SUPABASE_URL || '').trim();
  const key = (env.SUPABASE_ANON_KEY || '').trim();

  if (!url || !key) {
    console.warn('useTranslation: Supabase configuration missing. Translation will be disabled.');
    return null;
  }

  try {
    supabaseInstance = createClient(url, key);
    return supabaseInstance;
  } catch (e) {
    console.error('useTranslation: Failed to create Supabase client', e);
    return null;
  }
};

export const useTranslation = (userId: string, initialLanguage: string = 'en') => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState(initialLanguage);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateText = useCallback(async (text: string): Promise<string> => {
    if (!isEnabled || !text.trim()) return text;

    const supabase = getSupabase();
    if (!supabase) {
      setError('CONFIG_MISSING');
      setIsEnabled(false);
      return text;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('translate-message', {
        body: {
          text,
          targetLanguage,
          userId,
        } as TranslationRequest,
      });

      if (funcError) {
        // Handle Quota Exhaustion (402 Payment Required)
        if (funcError.status === 402) {
          setIsEnabled(false);
          setError('QUOTA_EXCEEDED');
          return text;
        }
        throw new Error(funcError.message || 'Translation failed');
      }

      const response = data as TranslationResponse;
      return response.translatedText;
    } catch (err: any) {
      console.error('Translation Hook Error:', err);
      setError(err.message);
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [isEnabled, targetLanguage, userId]);

  return {
    isEnabled,
    setIsEnabled,
    targetLanguage,
    setTargetLanguage,
    translateText,
    isTranslating,
    error,
  };
};
