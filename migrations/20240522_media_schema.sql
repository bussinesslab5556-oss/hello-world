
-- 1. MEDIA ATTACHMENTS TABLE
CREATE TABLE public.message_attachments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL, -- R2 Key
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'document')),
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb, -- Store width, height, duration, etc.
  thumbnail_path text, -- R2 Key for generated thumbnail
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. INDEXING
CREATE INDEX idx_attachments_message_id ON public.message_attachments(message_id);
CREATE INDEX idx_attachments_user_id ON public.message_attachments(user_id);

-- 3. RLS POLICIES
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Allow users to see attachments for any message they can see
CREATE POLICY "View attachments if message is viewable" 
ON public.message_attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.messages 
    WHERE messages.id = message_attachments.message_id
  )
);

CREATE POLICY "Users can only insert their own attachments" 
ON public.message_attachments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. ATOMIC COMMIT FUNCTION (Stored Procedure)
-- Handles the multi-table insert and usage increment in one transaction
CREATE OR REPLACE FUNCTION commit_media_message(
  p_chat_id uuid,
  p_sender_id uuid,
  p_text text,
  p_attachments jsonb
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
  v_total_size bigint := 0;
  v_attachment record;
BEGIN
  -- 1. Create the base message
  INSERT INTO public.messages (chat_id, sender_id, original_text, status)
  VALUES (p_chat_id, p_sender_id, p_text, 'sent')
  RETURNING id INTO v_message_id;

  -- 2. Insert attachments and calculate total size
  FOR v_attachment IN SELECT * FROM jsonb_to_recordset(p_attachments) 
    AS x(storage_path text, media_type text, mime_type text, file_size bigint, metadata jsonb)
  LOOP
    INSERT INTO public.message_attachments (message_id, user_id, storage_path, media_type, mime_type, file_size, metadata)
    VALUES (v_message_id, p_sender_id, v_attachment.storage_path, v_attachment.media_type, v_attachment.mime_type, v_attachment.file_size, v_attachment.metadata);
    
    v_total_size := v_total_size + v_attachment.file_size;
  END LOOP;

  -- 3. Atomic Usage Increment
  PERFORM increment_usage(p_sender_id, 'storage_used', v_total_size);

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
