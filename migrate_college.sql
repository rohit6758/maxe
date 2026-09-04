-- Add college column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college text;
UPDATE public.profiles SET college = 'ANITS' WHERE college IS NULL;

-- Add college column to communities
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS college text;
UPDATE public.communities SET college = 'ANITS' WHERE college IS NULL;

-- Add college column to semesters
ALTER TABLE public.semesters ADD COLUMN IF NOT EXISTS college text;
UPDATE public.semesters SET college = 'ANITS' WHERE college IS NULL;

-- Add college column to subjects
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS college text;
UPDATE public.subjects SET college = 'ANITS' WHERE college IS NULL;
