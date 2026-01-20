
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { checkUserQuota } from '../utils/quota-engine.ts';
import { profileService } from './profile-service.ts';

export class AudioBridgeService {
  private static instance: AudioBridgeService;
  private supabase: SupabaseClient | null = null;
  private recognizer: SpeechSDK.SpeechRecognizer | null = null;
  private synthesizer: SpeechSDK.SpeechSynthesizer | null = null;
  private quotaInterval: any = null;

  private constructor() {
    const env = typeof process !== 'undefined' ? process.env : {};
    const url = (env.SUPABASE_URL || '').trim();
    const key = (env.SUPABASE_ANON_KEY || '').trim();
    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  public static getInstance(): AudioBridgeService {
    if (!AudioBridgeService.instance) {
      AudioBridgeService.instance = new AudioBridgeService();
    }
    return AudioBridgeService.instance;
  }

  async startTranslationBridge(userId: string, targetLang: string, hmsActions: any, onQuotaExhausted: () => void) {
    const profile = await profileService.getProfile(userId);
    if (!profile || !this.supabase) return;

    const env = typeof process !== 'undefined' ? process.env : {};
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      env.AZURE_SPEECH_KEY || '',
      env.AZURE_SPEECH_REGION || ''
    );
    speechConfig.speechRecognitionLanguage = profile.primary_language || 'en-US';
    speechConfig.speechSynthesisVoiceName = this.getAzureVoice(profile.tone_control || 'Professional', targetLang);

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    this.recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    this.synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);

    this.recognizer.recognized = async (s, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        const { data, error } = await this.supabase!.functions.invoke('translate-message', {
          body: { text: e.result.text, targetLanguage: targetLang, userId: userId }
        });
        if (!error && data?.translatedText) {
          this.synthesizer?.speakTextAsync(data.translatedText);
        }
      }
    };

    this.recognizer.startContinuousRecognitionAsync();

    // Heartbeat: Atomic Increment
    this.quotaInterval = setInterval(async () => {
      const quota = await checkUserQuota(this.supabase!, userId, 'CALL', 1);
      if (!quota.allowed) {
        this.stopTranslationBridge();
        hmsActions.leave();
        onQuotaExhausted();
      } else {
        // Atomic RPC call prevents overwriting usage if multiple streams exist
        await this.supabase!.rpc('increment_usage', { 
          u_id: userId, 
          col_name: 'call_minutes_count', 
          amount: 1 
        });
      }
    }, 60000);
  }

  stopTranslationBridge() {
    this.recognizer?.stopContinuousRecognitionAsync();
    this.recognizer?.close();
    this.synthesizer?.close();
    if (this.quotaInterval) clearInterval(this.quotaInterval);
    this.recognizer = null;
    this.synthesizer = null;
  }

  private getAzureVoice(tone: string, lang: string): string {
    const langPrefix = lang.split('-')[0];
    const mappings: any = {
      'Professional': { 'en': 'en-US-AvaNeural', 'es': 'es-ES-AlvaroNeural' },
      'Casual': { 'en': 'en-US-AndrewNeural', 'es': 'es-ES-ElviraNeural' },
      'Negotiation': { 'en': 'en-US-GuyNeural', 'es': 'es-MX-DaliaNeural' }
    };
    return mappings[tone]?.[langPrefix] || mappings['Professional']['en'];
  }
}

export const audioBridgeService = AudioBridgeService.getInstance();
