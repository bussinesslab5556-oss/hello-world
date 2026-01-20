
export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  userId: string;
}

export interface TranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
  usageInfo?: {
    charactersProcessed: number;
    remainingQuota: number;
  };
}

export interface AzureTranslationResponse {
  translations: {
    text: string;
    to: string;
  }[];
  detectedLanguage?: {
    language: string;
    score: number;
  };
}
