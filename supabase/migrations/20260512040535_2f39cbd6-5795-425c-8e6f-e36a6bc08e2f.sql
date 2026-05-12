-- Business profiles
CREATE TABLE public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  business_type TEXT,
  default_language TEXT NOT NULL DEFAULT 'English',
  default_tone TEXT NOT NULL DEFAULT 'Professional',
  default_length TEXT NOT NULL DEFAULT 'Medium',
  custom_instruction TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.business_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.business_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.business_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own profile delete" ON public.business_profiles FOR DELETE USING (auth.uid() = user_id);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reviews_user_idx ON public.reviews(user_id, created_at DESC);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reviews select" ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own reviews insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own reviews update" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own reviews delete" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Replies
CREATE TABLE public.replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX replies_review_idx ON public.replies(review_id);
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own replies select" ON public.replies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own replies insert" ON public.replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own replies update" ON public.replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own replies delete" ON public.replies FOR DELETE USING (auth.uid() = user_id);

-- Usage
CREATE TABLE public.usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  replies_used INT NOT NULL DEFAULT 0,
  plan_type TEXT NOT NULL DEFAULT 'free',
  billing_cycle_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own usage select" ON public.usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own usage insert" ON public.usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own usage update" ON public.usage FOR UPDATE USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER bp_updated BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create rows on new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.business_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.usage (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();