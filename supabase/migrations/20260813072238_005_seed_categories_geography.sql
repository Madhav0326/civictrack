/*
# Seed Categories, Subcategories, and Geographic Data

1. Overview
   Seeds the 5 main categories with their subcategories, and a representative set of
   Indian states, union territories, districts, and cities for demo/initial data.

2. Categories Seeded
   - Infrastructure (is_sensitive=false)
   - Government Services (is_sensitive=false)
   - Administrative Problems (is_sensitive=false)
   - Public Service Experience (is_sensitive=false)
   - Integrity / Corruption (is_sensitive=true)

3. Geography Seeded
   - 28 states + 8 union territories with codes and approximate lat/lng.
   - A subset of major districts and cities across several states for demo purposes.
   - More can be added later via import.

4. Notes
   - This is seed data. All entries are idempotent (uses ON CONFLICT DO NOTHING).
   - Geographic coordinates are approximate centroids for map display.
*/

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO categories (name, slug, icon, description, sort_order, is_sensitive) VALUES
  ('Infrastructure', 'infrastructure', 'Building2', 'Roads, drainage, water supply, waste management, public transport, and other physical infrastructure issues.', 1, false),
  ('Government Services', 'government-services', 'Landmark', 'Issues with government hospitals, schools, ration/PDS, pensions, certificates, licenses, and other government services.', 2, false),
  ('Administrative Problems', 'administrative-problems', 'Clock', 'Delays, unprocessed applications, repeated visits, missing responses, incorrect records, and department coordination problems.', 3, false),
  ('Public Service Experience', 'public-service-experience', 'Users', 'Rude or unprofessional behaviour, refusal of service, misleading information, unreasonable delays, and lack of assistance.', 4, false),
  ('Integrity / Corruption', 'integrity-corruption', 'ShieldAlert', 'Allegations of bribe demands, misuse of public resources, irregularities, and fraud. These are citizen allegations, not established facts.', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUBCATEGORIES
-- ============================================
-- Infrastructure
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Roads', 'roads', 1 FROM categories c WHERE c.slug = 'infrastructure'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Potholes', 'potholes', 2 FROM categories c WHERE c.slug = 'infrastructure'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Streetlights', 'streetlights', 3 FROM categories c WHERE c.slug = 'infrastructure'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Drainage', 'drainage', 4 FROM categories c WHERE c.slug = 'infrastructure'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Water Supply', 'water-supply', 5 FROM categories c WHERE c.slug = 'infrastructure'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Garbage / Waste', 'garbage-waste', 6 FROM categories c WHERE c.slug = 'infrastructure'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Public Toilets', 'public-toilets', 7 FROM categories c WHERE c.slug = 'infrastructure'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Public Transport', 'public-transport', 8 FROM categories c WHERE c.slug = 'infrastructure'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Government Buildings', 'government-buildings', 9 FROM categories c WHERE c.slug = 'infrastructure'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Footpaths', 'footpaths', 10 FROM categories c WHERE c.slug = 'infrastructure'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Traffic Infrastructure', 'traffic-infrastructure', 11 FROM categories c WHERE c.slug = 'infrastructure'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Other Infrastructure', 'other-infrastructure', 12 FROM categories c WHERE c.slug = 'infrastructure'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Government Services
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Government Hospitals', 'government-hospitals', 1 FROM categories c WHERE c.slug = 'government-services'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Government Schools', 'government-schools', 2 FROM categories c WHERE c.slug = 'government-services'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Ration / PDS', 'ration-pds', 3 FROM categories c WHERE c.slug = 'government-services'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Pension', 'pension', 4 FROM categories c WHERE c.slug = 'government-services'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Certificates', 'certificates', 5 FROM categories c WHERE c.slug = 'government-services'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Licenses', 'licenses', 6 FROM categories c WHERE c.slug = 'government-services'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Land / Revenue Services', 'land-revenue-services', 7 FROM categories c WHERE c.slug = 'government-services'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Municipal Services', 'municipal-services', 8 FROM categories c WHERE c.slug = 'government-services'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Electricity Services', 'electricity-services', 9 FROM categories c WHERE c.slug = 'government-services'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Other Government Services', 'other-government-services', 10 FROM categories c WHERE c.slug = 'government-services'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Administrative Problems
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Excessive Delay', 'excessive-delay', 1 FROM categories c WHERE c.slug = 'administrative-problems'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Application Not Processed', 'application-not-processed', 2 FROM categories c WHERE c.slug = 'administrative-problems'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Repeated Visits Required', 'repeated-visits', 3 FROM categories c WHERE c.slug = 'administrative-problems'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Missing Response', 'missing-response', 4 FROM categories c WHERE c.slug = 'administrative-problems'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Incorrect Records', 'incorrect-records', 5 FROM categories c WHERE c.slug = 'administrative-problems'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Department Coordination Problem', 'department-coordination', 6 FROM categories c WHERE c.slug = 'administrative-problems'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Staff Absence', 'staff-absence', 7 FROM categories c WHERE c.slug = 'administrative-problems'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Public Service Experience
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Rude / Unprofessional Behaviour', 'rude-unprofessional-behaviour', 1 FROM categories c WHERE c.slug = 'public-service-experience'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Refusal to Provide Service', 'refusal-of-service', 2 FROM categories c WHERE c.slug = 'public-service-experience'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Misleading Information', 'misleading-information', 3 FROM categories c WHERE c.slug = 'public-service-experience'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Unreasonable Delay', 'unreasonable-delay', 4 FROM categories c WHERE c.slug = 'public-service-experience'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Lack of Assistance', 'lack-of-assistance', 5 FROM categories c WHERE c.slug = 'public-service-experience'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Integrity / Corruption
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Bribe Allegedly Demanded', 'bribe-allegedly-demanded', 1 FROM categories c WHERE c.slug = 'integrity-corruption'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Suspected Misuse of Public Resources', 'misuse-of-public-resources', 2 FROM categories c WHERE c.slug = 'integrity-corruption'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Suspected Irregularity', 'suspected-irregularity', 3 FROM categories c WHERE c.slug = 'integrity-corruption'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Suspected Fraud', 'suspected-fraud', 4 FROM categories c WHERE c.slug = 'integrity-corruption'
ON CONFLICT (category_id, slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order)
SELECT c.id, 'Other Integrity Concern', 'other-integrity-concern', 5 FROM categories c WHERE c.slug = 'integrity-corruption'
ON CONFLICT (category_id, slug) DO NOTHING;

-- ============================================
-- GEOGRAPHIC DATA: STATES
-- ============================================
INSERT INTO geo_states (code, name, type, latitude, longitude) VALUES
  ('AP', 'Andhra Pradesh', 'state', 15.9129, 79.7400),
  ('AR', 'Arunachal Pradesh', 'state', 28.2180, 94.7278),
  ('AS', 'Assam', 'state', 26.2006, 92.9376),
  ('BR', 'Bihar', 'state', 25.0961, 85.3131),
  ('CG', 'Chhattisgarh', 'state', 21.2787, 81.8661),
  ('GA', 'Goa', 'state', 15.2993, 74.1240),
  ('GJ', 'Gujarat', 'state', 23.0225, 72.5714),
  ('HR', 'Haryana', 'state', 29.0588, 76.0856),
  ('HP', 'Himachal Pradesh', 'state', 31.1048, 77.1734),
  ('JH', 'Jharkhand', 'state', 23.6102, 85.2799),
  ('KA', 'Karnataka', 'state', 15.3173, 75.7139),
  ('KL', 'Kerala', 'state', 10.8505, 76.2711),
  ('MP', 'Madhya Pradesh', 'state', 22.9734, 78.6569),
  ('MH', 'Maharashtra', 'state', 19.7515, 75.7139),
  ('MN', 'Manipur', 'state', 24.8037, 93.9383),
  ('ML', 'Meghalaya', 'state', 25.4670, 91.3662),
  ('MZ', 'Mizoram', 'state', 23.1645, 92.9376),
  ('NL', 'Nagaland', 'state', 26.1584, 94.5624),
  ('OD', 'Odisha', 'state', 20.9517, 85.0985),
  ('PB', 'Punjab', 'state', 31.1471, 75.3412),
  ('RJ', 'Rajasthan', 'state', 27.0238, 74.2169),
  ('SK', 'Sikkim', 'state', 27.5330, 88.5122),
  ('TN', 'Tamil Nadu', 'state', 11.1271, 78.6569),
  ('TG', 'Telangana', 'state', 18.1124, 79.0193),
  ('TR', 'Tripura', 'state', 23.9408, 91.9882),
  ('UP', 'Uttar Pradesh', 'state', 26.8467, 80.9462),
  ('UK', 'Uttarakhand', 'state', 30.0668, 79.0193),
  ('WB', 'West Bengal', 'state', 22.9868, 87.8550),
  ('AN', 'Andaman and Nicobar Islands', 'union_territory', 11.7401, 92.6586),
  ('CH', 'Chandigarh', 'union_territory', 30.7333, 76.7794),
  ('DH', 'Dadra and Nagar Haveli and Daman and Diu', 'union_territory', 20.3974, 72.8328),
  ('DL', 'Delhi', 'union_territory', 28.7041, 77.1025),
  ('JK', 'Jammu and Kashmir', 'union_territory', 34.0837, 74.7973),
  ('LA', 'Ladakh', 'union_territory', 34.1526, 77.5771),
  ('LD', 'Lakshadweep', 'union_territory', 10.5662, 72.6417),
  ('PY', 'Puducherry', 'union_territory', 11.9416, 79.8083)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- GEOGRAPHIC DATA: DISTRICTS & CITIES (major ones for demo)
-- ============================================
-- Andhra Pradesh
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Visakhapatnam', 17.6868, 83.2185 FROM geo_states s WHERE s.code = 'AP'
ON CONFLICT (state_id, name) DO NOTHING;
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'East Godavari', 17.0000, 81.7833 FROM geo_states s WHERE s.code = 'AP'
ON CONFLICT (state_id, name) DO NOTHING;
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Chittoor', 13.6288, 79.4192 FROM geo_states s WHERE s.code = 'AP'
ON CONFLICT (state_id, name) DO NOTHING;

-- Delhi
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'New Delhi', 28.6139, 77.2090 FROM geo_states s WHERE s.code = 'DL'
ON CONFLICT (state_id, name) DO NOTHING;
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'North Delhi', 28.7000, 77.2000 FROM geo_states s WHERE s.code = 'DL'
ON CONFLICT (state_id, name) DO NOTHING;
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'South Delhi', 28.5300, 77.2500 FROM geo_states s WHERE s.code = 'DL'
ON CONFLICT (state_id, name) DO NOTHING;

-- Maharashtra
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Mumbai City', 18.9434, 72.8235 FROM geo_states s WHERE s.code = 'MH'
ON CONFLICT (state_id, name) DO NOTHING;
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Pune', 18.5204, 73.8567 FROM geo_states s WHERE s.code = 'MH'
ON CONFLICT (state_id, name) DO NOTHING;
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Nagpur', 21.1458, 79.0882 FROM geo_states s WHERE s.code = 'MH'
ON CONFLICT (state_id, name) DO NOTHING;

-- Karnataka
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Bengaluru Urban', 12.9716, 77.5946 FROM geo_states s WHERE s.code = 'KA'
ON CONFLICT (state_id, name) DO NOTHING;
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Mysuru', 12.2958, 76.6394 FROM geo_states s WHERE s.code = 'KA'
ON CONFLICT (state_id, name) DO NOTHING;

-- Tamil Nadu
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Chennai', 13.0827, 80.2707 FROM geo_states s WHERE s.code = 'TN'
ON CONFLICT (state_id, name) DO NOTHING;
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Coimbatore', 11.0168, 76.9558 FROM geo_states s WHERE s.code = 'TN'
ON CONFLICT (state_id, name) DO NOTHING;

-- Telangana
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Hyderabad', 17.3850, 78.4867 FROM geo_states s WHERE s.code = 'TG'
ON CONFLICT (state_id, name) DO NOTHING;

-- West Bengal
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Kolkata', 22.5726, 88.3639 FROM geo_states s WHERE s.code = 'WB'
ON CONFLICT (state_id, name) DO NOTHING;

-- Uttar Pradesh
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Lucknow', 26.8467, 80.9462 FROM geo_states s WHERE s.code = 'UP'
ON CONFLICT (state_id, name) DO NOTHING;
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Gautam Buddh Nagar', 28.5355, 77.3910 FROM geo_states s WHERE s.code = 'UP'
ON CONFLICT (state_id, name) DO NOTHING;

-- Gujarat
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Ahmedabad', 23.0225, 72.5714 FROM geo_states s WHERE s.code = 'GJ'
ON CONFLICT (state_id, name) DO NOTHING;
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Surat', 21.1702, 72.8311 FROM geo_states s WHERE s.code = 'GJ'
ON CONFLICT (state_id, name) DO NOTHING;

-- Rajasthan
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Jaipur', 26.9124, 75.7873 FROM geo_states s WHERE s.code = 'RJ'
ON CONFLICT (state_id, name) DO NOTHING;

-- Kerala
INSERT INTO geo_districts (state_id, name, latitude, longitude)
SELECT s.id, 'Ernakulam', 10.0140, 76.3418 FROM geo_states s WHERE s.code = 'KL'
ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================
-- CITIES
-- ============================================
INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Visakhapatnam', 17.6868, 83.2185 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'AP' AND d.name = 'Visakhapatnam'
ON CONFLICT (district_id, name) DO NOTHING;
INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Kakinada', 16.9890, 82.2470 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'AP' AND d.name = 'East Godavari'
ON CONFLICT (district_id, name) DO NOTHING;
INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Tirupati', 13.6288, 79.4192 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'AP' AND d.name = 'Chittoor'
ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'New Delhi', 28.6139, 77.2090 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'DL' AND d.name = 'New Delhi'
ON CONFLICT (district_id, name) DO NOTHING;
INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Delhi', 28.7041, 77.1025 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'DL' AND d.name = 'North Delhi'
ON CONFLICT (district_id, name) DO NOTHING;
INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'South Delhi', 28.5300, 77.2500 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'DL' AND d.name = 'South Delhi'
ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Mumbai', 18.9434, 72.8235 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'MH' AND d.name = 'Mumbai City'
ON CONFLICT (district_id, name) DO NOTHING;
INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Pune', 18.5204, 73.8567 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'MH' AND d.name = 'Pune'
ON CONFLICT (district_id, name) DO NOTHING;
INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Nagpur', 21.1458, 79.0882 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'MH' AND d.name = 'Nagpur'
ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Bengaluru', 12.9716, 77.5946 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'KA' AND d.name = 'Bengaluru Urban'
ON CONFLICT (district_id, name) DO NOTHING;
INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Mysuru', 12.2958, 76.6394 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'KA' AND d.name = 'Mysuru'
ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Chennai', 13.0827, 80.2707 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'TN' AND d.name = 'Chennai'
ON CONFLICT (district_id, name) DO NOTHING;
INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Coimbatore', 11.0168, 76.9558 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'TN' AND d.name = 'Coimbatore'
ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Hyderabad', 17.3850, 78.4867 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'TG' AND d.name = 'Hyderabad'
ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Kolkata', 22.5726, 88.3639 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'WB' AND d.name = 'Kolkata'
ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Lucknow', 26.8467, 80.9462 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'UP' AND d.name = 'Lucknow'
ON CONFLICT (district_id, name) DO NOTHING;
INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Noida', 28.5355, 77.3910 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'UP' AND d.name = 'Gautam Buddh Nagar'
ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Ahmedabad', 23.0225, 72.5714 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'GJ' AND d.name = 'Ahmedabad'
ON CONFLICT (district_id, name) DO NOTHING;
INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Surat', 21.1702, 72.8311 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'GJ' AND d.name = 'Surat'
ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Jaipur', 26.9124, 75.7873 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'RJ' AND d.name = 'Jaipur'
ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name, latitude, longitude)
SELECT d.id, 'Kochi', 10.0140, 76.3418 FROM geo_districts d JOIN geo_states s ON d.state_id = s.id WHERE s.code = 'KL' AND d.name = 'Ernakulam'
ON CONFLICT (district_id, name) DO NOTHING;

-- ============================================
-- LOCALITIES (sample for major cities)
-- ============================================
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Madhurawada', '530041', 17.8200, 83.4020 FROM geo_cities c WHERE c.name = 'Visakhapatnam'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Dwaraka Nagar', '530016', 17.7200, 83.3000 FROM geo_cities c WHERE c.name = 'Visakhapatnam'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Gajuwaka', '530026', 17.6800, 83.1800 FROM geo_cities c WHERE c.name = 'Visakhapatnam'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Connaught Place', '110001', 28.6315, 77.2167 FROM geo_cities c WHERE c.name = 'New Delhi'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Karol Bagh', '110005', 28.6519, 77.1909 FROM geo_cities c WHERE c.name = 'New Delhi'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Saket', '110017', 28.5245, 77.2066 FROM geo_cities c WHERE c.name = 'New Delhi'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Andheri', '400053', 19.1136, 72.8697 FROM geo_cities c WHERE c.name = 'Mumbai'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Bandra', '400050', 19.0596, 72.8295 FROM geo_cities c WHERE c.name = 'Mumbai'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Dadar', '400014', 19.0177, 72.8444 FROM geo_cities c WHERE c.name = 'Mumbai'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Indiranagar', '560038', 12.9719, 77.6412 FROM geo_cities c WHERE c.name = 'Bengaluru'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Koramangala', '560095', 12.9352, 77.6245 FROM geo_cities c WHERE c.name = 'Bengaluru'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Whitefield', '560066', 12.9698, 77.7500 FROM geo_cities c WHERE c.name = 'Bengaluru'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'T. Nagar', '600017', 13.0418, 80.2341 FROM geo_cities c WHERE c.name = 'Chennai'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Adyar', '600020', 13.0012, 80.2555 FROM geo_cities c WHERE c.name = 'Chennai'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Banjara Hills', '500034', 17.4126, 78.4392 FROM geo_cities c WHERE c.name = 'Hyderabad'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Gachibowli', '500032', 17.4400, 78.3489 FROM geo_cities c WHERE c.name = 'Hyderabad'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Salt Lake', '700091', 22.5800, 88.4200 FROM geo_cities c WHERE c.name = 'Kolkata'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Park Street', '700016', 22.5535, 88.3521 FROM geo_cities c WHERE c.name = 'Kolkata'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Hinjawadi', '411057', 18.5900, 73.6850 FROM geo_cities c WHERE c.name = 'Pune'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Koregaon Park', '411001', 18.5362, 73.8939 FROM geo_cities c WHERE c.name = 'Pune'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Sector 62', '201309', 28.6280, 77.3650 FROM geo_cities c WHERE c.name = 'Noida'
ON CONFLICT DO NOTHING;
INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Sector 18', '201301', 28.5700, 77.3250 FROM geo_cities c WHERE c.name = 'Noida'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Satellite', '380015', 23.0297, 72.5075 FROM geo_cities c WHERE c.name = 'Ahmedabad'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Vaishali Nagar', '302021', 26.9124, 75.7425 FROM geo_cities c WHERE c.name = 'Jaipur'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Edappally', '682024', 10.0250, 76.3120 FROM geo_cities c WHERE c.name = 'Kochi'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Surat City', '395007', 21.1702, 72.8311 FROM geo_cities c WHERE c.name = 'Surat'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Hazratganj', '226001', 26.8500, 80.9500 FROM geo_cities c WHERE c.name = 'Lucknow'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Nagpur City', '440001', 21.1458, 79.0882 FROM geo_cities c WHERE c.name = 'Nagpur'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Mysuru City', '570001', 12.2958, 76.6394 FROM geo_cities c WHERE c.name = 'Mysuru'
ON CONFLICT DO NOTHING;

INSERT INTO geo_localities (city_id, name, pincode, latitude, longitude)
SELECT c.id, 'Coimbatore City', '641001', 11.0168, 76.9558 FROM geo_cities c WHERE c.name = 'Coimbatore'
ON CONFLICT DO NOTHING;
