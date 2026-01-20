
export type IndustryMode = 'General' | 'Business' | 'Freelance' | 'Legal' | 'Medical' | 'Tech';
export type ToneControl = 'Professional' | 'Casual' | 'Formal' | 'Negotiation';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  primary_language: string | null; // ISO 639-1 code
  secondary_language: string | null; // ISO 639-1 code
  industry_mode: IndustryMode | null;
  tone_control: ToneControl | null;
  updated_at: string;
}
