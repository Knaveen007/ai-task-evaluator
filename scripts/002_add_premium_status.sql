-- Add is_premium column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;

-- Update existing profiles to have is_premium = false (handled by default, but good to be explicit if needed)
-- UPDATE public.profiles SET is_premium = false WHERE is_premium IS NULL;
