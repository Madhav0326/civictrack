ALTER TABLE public.issues
ADD CONSTRAINT issues_user_id_profiles_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;