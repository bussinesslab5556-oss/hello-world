-- Automatically provision user records upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_full_name text;
BEGIN
  -- Extract full name from metadata if available, otherwise use email prefix
  default_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  -- Step 1: Create Profile
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    default_full_name,
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Step 2: Initialize Usage Tracking
  INSERT INTO public.user_usage (user_id)
  VALUES (new.id);

  -- Step 3: Set Default Free Subscription
  INSERT INTO public.subscriptions (
    user_id, 
    tier, 
    status,
    current_period_end
  )
  VALUES (
    new.id, 
    'Free', 
    'active',
    now() + interval '30 days'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution hook
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();