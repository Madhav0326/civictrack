/*
# Profile Privacy Enforcement & Avatars Storage Bucket

1. Overview
   This migration hardens `profiles` table Row Level Security (RLS) to enforce `is_private`
   at the database layer, and creates a secure storage bucket for user avatars.

2. Changes
   - Replaces `profiles` SELECT policy so private profiles (`is_private = true`) can only be read
     by the profile owner (`auth.uid() = id`) or admins/moderators.
   - Creates the `avatars` storage bucket.
   - Configures storage RLS policies ensuring users can ONLY upload, update, or delete objects inside
     their own user folder (`avatars/<user_id>/...`).
*/

-- ============================================
-- 1. HARDEN PROFILES SELECT RLS POLICY
-- ============================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;

CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (
    is_private = false
    OR auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles AS self
      WHERE self.id = auth.uid() AND self.role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- 2. AVATARS STORAGE BUCKET & RLS POLICIES
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
CREATE POLICY "Public can read avatars"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
