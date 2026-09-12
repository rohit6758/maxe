-- Phase 3 AI Schema
-- Run this in your Supabase SQL Editor

-- 1. Create table to track AI usage for the Freemium model
CREATE TABLE IF NOT EXISTS public.ai_usage (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    queries_used INTEGER DEFAULT 0,
    last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can view their own AI usage"
    ON public.ai_usage FOR SELECT
    USING (auth.uid() = user_id);

-- System handles inserts/updates via Edge Functions (Service Role), but we can allow inserts for new users
CREATE POLICY "Users can insert their own AI usage record"
    ON public.ai_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. Create table for generated AI materials (Flashcards, Quizzes, Notes)
CREATE TABLE IF NOT EXISTS public.ai_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('summary', 'flashcards', 'quiz', 'notes')),
    content JSONB NOT NULL,
    source_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI materials"
    ON public.ai_materials FOR ALL
    USING (auth.uid() = user_id);

-- 3. Add trigger to automatically create an ai_usage row when a new profile is created
CREATE OR REPLACE FUNCTION public.handle_new_ai_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ai_usage (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for existing profiles table (if the trigger doesn't exist)
DROP TRIGGER IF EXISTS on_profile_created_ai_usage ON public.profiles;
CREATE TRIGGER on_profile_created_ai_usage
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_ai_usage();

-- 4. Backfill existing users
INSERT INTO public.ai_usage (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
