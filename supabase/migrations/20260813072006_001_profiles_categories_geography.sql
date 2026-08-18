/*
# Profiles, Categories, and Geographic Hierarchy

1. Overview
   This migration creates the foundational tables for the civic accountability platform:
   - User profiles (linked to Supabase auth.users)
   - User roles (citizen, moderator, admin)
   - Issue categories and subcategories
   - Geographic hierarchy: States → Districts → Cities → Wards → Localities

2. New Tables
   - `profiles`: Public user profile data (display name, avatar, bio, privacy settings). One row per auth.user.
   - `categories`: Top-level issue categories (Infrastructure, Government Services, Administrative Problems, Public Service Experience, Integrity/Corruption).
   - `subcategories`: Sub-categories under each category (Roads, Potholes, Streetlights, etc.).
   - `geo_states`: Indian states and union territories.
   - `geo_districts`: Districts within states.
   - `geo_cities`: Cities/towns within districts.
   - `geo_wards`: Wards within cities/municipalities.
   - `geo_localities`: Localities/areas within wards or cities.

3. Security
   - RLS enabled on all tables.
   - Profiles: users can read all profiles (public display), update only their own.
   - Categories/subcategories: public read (anon + authenticated), no public writes.
   - Geography: public read (anon + authenticated), no public writes.

4. Notes
   - Profiles use auth.uid() as primary key, referencing auth.users(id).
   - Categories are seeded with the 5 main categories and their subcategories.
   - Geography tables support a scalable hierarchy for all of India.
*/

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  is_private boolean NOT NULL DEFAULT false,
  is_suspended boolean NOT NULL DEFAULT false,
  is_banned boolean NOT NULL DEFAULT false,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'moderator', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_sensitive boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- SUBCATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS subcategories (
  id smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  category_id smallint NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subcategories are publicly readable" ON subcategories;
CREATE POLICY "Subcategories are publicly readable"
  ON subcategories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

-- ============================================
-- GEOGRAPHIC HIERARCHY
-- ============================================
CREATE TABLE IF NOT EXISTS geo_states (
  id smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'state' CHECK (type IN ('state', 'union_territory')),
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE geo_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "States are publicly readable" ON geo_states;
CREATE POLICY "States are publicly readable"
  ON geo_states FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS geo_districts (
  id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  state_id smallint NOT NULL REFERENCES geo_states(id) ON DELETE CASCADE,
  name text NOT NULL,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (state_id, name)
);

ALTER TABLE geo_districts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Districts are publicly readable" ON geo_districts;
CREATE POLICY "Districts are publicly readable"
  ON geo_districts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_geo_districts_state_id ON geo_districts(state_id);

CREATE TABLE IF NOT EXISTS geo_cities (
  id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  district_id int NOT NULL REFERENCES geo_districts(id) ON DELETE CASCADE,
  name text NOT NULL,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (district_id, name)
);

ALTER TABLE geo_cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cities are publicly readable" ON geo_cities;
CREATE POLICY "Cities are publicly readable"
  ON geo_cities FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_geo_cities_district_id ON geo_cities(district_id);

CREATE TABLE IF NOT EXISTS geo_wards (
  id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  city_id int NOT NULL REFERENCES geo_cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  number text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE geo_wards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Wards are publicly readable" ON geo_wards;
CREATE POLICY "Wards are publicly readable"
  ON geo_wards FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_geo_wards_city_id ON geo_wards(city_id);

CREATE TABLE IF NOT EXISTS geo_localities (
  id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ward_id int REFERENCES geo_wards(id) ON DELETE CASCADE,
  city_id int REFERENCES geo_cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  pincode text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE geo_localities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Localities are publicly readable" ON geo_localities;
CREATE POLICY "Localities are publicly readable"
  ON geo_localities FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_geo_localities_ward_id ON geo_localities(ward_id);
CREATE INDEX IF NOT EXISTS idx_geo_localities_city_id ON geo_localities(city_id);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- UPDATED_AT TRIGGER FOR PROFILES
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
