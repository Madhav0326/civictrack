-- Migration 020: Ensure every district has a valid city/town record in geo_cities
-- Preserves all previous migrations 001-019. Idempotent, additive, and non-destructive.

INSERT INTO public.geo_cities (district_id, name, latitude, longitude)
SELECT 
  d.id AS district_id,
  d.name AS name,
  d.latitude,
  d.longitude
FROM public.geo_districts d
WHERE NOT EXISTS (
  SELECT 1 FROM public.geo_cities c WHERE c.district_id = d.id
)
ON CONFLICT (district_id, name) DO NOTHING;
