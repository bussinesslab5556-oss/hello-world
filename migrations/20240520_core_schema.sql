-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE plan_tier AS ENUM ('Free', 'Premium', 'Pro', 'Business');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sub_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'unpaid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_status AS ENUM ('ringing', 'ongoing', 'ended', 'missed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_type AS ENUM ('audio', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
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

CREATE TABLE IF NOT EXISTS public.messages (
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

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tier plan_tier DEFAULT 'Free' NOT NULL,
  status sub_status DEFAULT 'active' NOT NULL,
  current_period_end timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_usage (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  translation_chars_count bigint DEFAULT 0 NOT NULL,
  call_minutes_count integer DEFAULT 0 NOT NULL,
  storage_used bigint DEFAULT 0 NOT NULL, 
  last_reset_date timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.translation_cache (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_text text NOT NULL,
  target_lang text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(source_text, target_lang)
);

-- 4. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION increment_usage(u_id uuid, col_name text, amount bigint)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE user_usage SET %I = %I + $1 WHERE user_id = $2', col_name, col_name)
  USING amount, u_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for Messages
CREATE POLICY "Users can view messages in their chats" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id);

-- Policies for Usage & Subscriptions
CREATE POLICY "Users can view own usage" ON public.user_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Policies for Translation Cache (Shared for cost optimization)
CREATE POLICY "Everyone can view translation cache" ON public.translation_cache FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert cache" ON public.translation_cache FOR INSERT WITH CHECK (auth.role() = 'authenticated');