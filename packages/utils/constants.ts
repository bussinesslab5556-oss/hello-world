
/**
 * Global Constants & Brand Identity
 */
import { PlanTier } from '../types/index.ts';

export { PlanTier };

export const BRAND_COLORS = {
  PRIMARY: '#007BFF',
  DARK_BG: '#2B2F36',
  TEXT_LIGHT: '#F8FAFC',
  TEXT_MUTED: '#94A3B8',
  SUCCESS: '#39FF14',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
} as const;

export interface PlanLimits {
  translation_limit: number; // characters
  call_minutes_limit: number; // minutes
  storage_limit_mb: number; // megabytes
}

export const SUBSCRIPTION_LIMITS: Record<PlanTier, PlanLimits> = {
  [PlanTier.FREE]: {
    translation_limit: 2000000,
    call_minutes_limit: 100,
    storage_limit_mb: 500,
  },
  [PlanTier.PREMIUM]: {
    translation_limit: 5000000,
    call_minutes_limit: 5000,
    storage_limit_mb: 5000,
  },
  [PlanTier.PRO]: {
    translation_limit: Number.MAX_SAFE_INTEGER,
    call_minutes_limit: Number.MAX_SAFE_INTEGER,
    storage_limit_mb: 20000,
  },
  [PlanTier.BUSINESS]: {
    translation_limit: Number.MAX_SAFE_INTEGER,
    call_minutes_limit: Number.MAX_SAFE_INTEGER,
    storage_limit_mb: 100000,
  },
};

export const DATABASE_SCHEMA_SQL = `
-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE plan_tier AS ENUM ('Free', 'Premium', 'Pro', 'Business');
CREATE TYPE sub_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'unpaid');
CREATE TYPE call_status AS ENUM ('ringing', 'ongoing', 'ended', 'missed', 'rejected');
CREATE TYPE call_type AS ENUM ('audio', 'video');

-- 2. TABLES
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  primary_language text DEFAULT 'en',
  secondary_language text,
  industry_mode text DEFAULT 'General',
  tone_control text DEFAULT 'Professional',
  notification_settings jsonb DEFAULT '{"show_preview": true, "vibrate": true}'::jsonb,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id uuid NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  original_text text NOT NULL,
  translated_text text,
  is_edited boolean DEFAULT false NOT NULL,
  is_deleted boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  status text DEFAULT 'sent' NOT NULL
);

CREATE TABLE public.subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tier plan_tier DEFAULT 'Free' NOT NULL,
  status sub_status DEFAULT 'active' NOT NULL,
  current_period_end timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_usage (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  translation_chars_count bigint DEFAULT 0 NOT NULL,
  call_minutes_count integer DEFAULT 0 NOT NULL,
  storage_used bigint DEFAULT 0 NOT NULL, 
  last_reset_date timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. ATOMIC INCREMENT FUNCTION
CREATE OR REPLACE FUNCTION increment_usage(u_id uuid, col_name text, amount bigint)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE user_usage SET %I = %I + $1 WHERE user_id = $2', col_name, col_name)
  USING amount, u_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages are viewable by everyone" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id);

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON public.user_usage FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
`;
