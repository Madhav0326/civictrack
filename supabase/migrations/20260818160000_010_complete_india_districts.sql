/*
# Complete Geographic Hierarchy for All Indian States and Union Territories

1. Overview
   This migration completes the administrative district dataset for all 36 Indian States
   and Union Territories in `geo_districts`, as well as adding key cities/municipalities in `geo_cities`.

2. Data Added
   - Complete official districts for all 28 States and 8 Union Territories of India (~750+ districts).
   - Key cities and municipality hubs for major districts across all regions.

3. Integrity
   - Idempotent execution via `ON CONFLICT (state_id, name) DO NOTHING`.
   - Existing district/city/locality IDs and references remain preserved.
*/

-- ============================================================
-- 1. ANDHRA PRADESH (AP)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Alluri Sitharama Raju'), ('Anakapalli'), ('Ananthapuramu'), ('Annamayya'),
  ('Bapatla'), ('Chittoor'), ('Dr. B.R. Ambedkar Konaseema'), ('East Godavari'),
  ('Eluru'), ('Guntur'), ('Kakinada'), ('Kurnool'), ('NTR'), ('Nandyal'),
  ('Palnadu'), ('Parvathipuram Manyam'), ('Prakasam'), ('Sri Potti Sriramulu Nellore'),
  ('Sri Sathya Sai'), ('Srikakulam'), ('Tirupati'), ('Visakhapatnam'),
  ('Vizianagaram'), ('West Godavari'), ('YSR Kadapa')
) AS d(name) WHERE s.code = 'AP' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 2. ARUNACHAL PRADESH (AR)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Anjaw'), ('Changlang'), ('Dibang Valley'), ('East Kameng'), ('East Siang'),
  ('Itanagar Capital Complex'), ('Kamle'), ('Kra Daadi'), ('Kurung Kumey'),
  ('Lepa Rada'), ('Lohit'), ('Longding'), ('Lower Dibang Valley'), ('Lower Subansiri'),
  ('Namsai'), ('Pakke Kessang'), ('Papum Pare'), ('Shi Yomi'), ('Siang'),
  ('Tawang'), ('Tirap'), ('Upper Siang'), ('Upper Subansiri'), ('West Kameng'), ('West Siang')
) AS d(name) WHERE s.code = 'AR' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 3. ASSAM (AS)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Baksa'), ('Barpeta'), ('Biswanath'), ('Bongaigaon'), ('Cachar'), ('Charaideo'),
  ('Chirang'), ('Darrang'), ('Dhemaji'), ('Dhubri'), ('Dibrugarh'), ('Dima Hasao'),
  ('Goalpara'), ('Golaghat'), ('Hailakandi'), ('Hojai'), ('Jorhat'), ('Kamrup'),
  ('Kamrup Metropolitan'), ('Karbi Anglong'), ('Karimganj'), ('Kokrajhar'),
  ('Lakhimpur'), ('Majuli'), ('Morigaon'), ('Nagaon'), ('Nalbari'), ('Sivasagar'),
  ('Sonitpur'), ('South Salmara-Mankachar'), ('Tinsukia'), ('Udalguri'), ('West Karbi Anglong')
) AS d(name) WHERE s.code = 'AS' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 4. BIHAR (BR)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Araria'), ('Arwal'), ('Aurangabad'), ('Banka'), ('Begusarai'), ('Bhagalpur'),
  ('Bhojpur'), ('Buxar'), ('Darbhanga'), ('East Champaran'), ('Gaya'), ('Gopalganj'),
  ('Jamui'), ('Jehanabad'), ('Kaimur'), ('Katihar'), ('Khagaria'), ('Kishanganj'),
  ('Lakhisarai'), ('Madhepura'), ('Madhubani'), ('Munger'), ('Muzaffarpur'),
  ('Nalanda'), ('Nawada'), ('Patna'), ('Purnia'), ('Rohtas'), ('Saharsa'),
  ('Samastipur'), ('Saran'), ('Sheikhpura'), ('Sheohar'), ('Sitamarhi'),
  ('Siwan'), ('Supaul'), ('Vaishali'), ('West Champaran')
) AS d(name) WHERE s.code = 'BR' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 5. CHHATTISGARH (CG)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Balod'), ('Baloda Bazar'), ('Balrampur'), ('Bastar'), ('Bemetara'), ('Bijapur'),
  ('Bilaspur'), ('Dantewada'), ('Dhamtari'), ('Durg'), ('Gariaband'),
  ('Gaurela-Pendra-Marwahi'), ('Janjgir-Champa'), ('Jashpur'), ('Kabirdham'),
  ('Kanker'), ('Khairagarh-Chhuikhadan-Gandai'), ('Kondagaon'), ('Korba'), ('Koriya'),
  ('Mahasamund'), ('Manendragarh-Chirmiri-Bharatpur'), ('Mohla-Manpur-Ambagarh Chowki'),
  ('Mungeli'), ('Narayanpur'), ('Raigarh'), ('Raipur'), ('Rajnandgaon'),
  ('Sarangarh-Bilaigarh'), ('Sukma'), ('Surajpur'), ('Surguja')
) AS d(name) WHERE s.code = 'CG' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 6. GOA (GA)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('North Goa'), ('South Goa')
) AS d(name) WHERE s.code = 'GA' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 7. GUJARAT (GJ)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Ahmedabad'), ('Amreli'), ('Anand'), ('Aravalli'), ('Banaskantha'), ('Bharuch'),
  ('Bhavnagar'), ('Botad'), ('Chhota Udaipur'), ('Dahod'), ('Dang'), ('Devbhumi Dwarka'),
  ('Gandhinagar'), ('Gir Somnath'), ('Jamnagar'), ('Junagadh'), ('Kheda'), ('Kutch'),
  ('Mahisagar'), ('Mehsana'), ('Morbi'), ('Narmada'), ('Navsari'), ('Panchmahal'),
  ('Patan'), ('Porbandar'), ('Rajkot'), ('Sabarkantha'), ('Surat'), ('Surendranagar'),
  ('Tapi'), ('Vadodara'), ('Valsad')
) AS d(name) WHERE s.code = 'GJ' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 8. HARYANA (HR)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Ambala'), ('Bhiwani'), ('Charkhi Dadri'), ('Faridabad'), ('Fatehabad'),
  ('Gurugram'), ('Hisar'), ('Jhajjar'), ('Jind'), ('Kaithal'), ('Karnal'),
  ('Kurukshetra'), ('Mahendragarh'), ('Nuh'), ('Palwal'), ('Panchkula'),
  ('Panipat'), ('Rewari'), ('Rohtak'), ('Sirsa'), ('Sonipat'), ('Yamunanagar')
) AS d(name) WHERE s.code = 'HR' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 9. HIMACHAL PRADESH (HP)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Bilaspur'), ('Chamba'), ('Hamirpur'), ('Kangra'), ('Kinnaur'), ('Kullu'),
  ('Lahaul and Spiti'), ('Mandi'), ('Shimla'), ('Sirmaur'), ('Solan'), ('Una')
) AS d(name) WHERE s.code = 'HP' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 10. JHARKHAND (JH)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Bokaro'), ('Chatra'), ('Deoghar'), ('Dhanbad'), ('Dumka'), ('East Singhbhum'),
  ('Garhwa'), ('Giridih'), ('Godda'), ('Gumla'), ('Hazaribagh'), ('Jamtara'),
  ('Khunti'), ('Koderma'), ('Latehar'), ('Lohardaga'), ('Pakur'), ('Palamu'),
  ('Ramgarh'), ('Ranchi'), ('Sahibganj'), ('Seraikela Kharsawan'), ('Simdega'), ('West Singhbhum')
) AS d(name) WHERE s.code = 'JH' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 11. KARNATAKA (KA)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Bagalkote'), ('Ballari'), ('Belagavi'), ('Bengaluru Rural'), ('Bengaluru Urban'),
  ('Bidar'), ('Chamarajanagara'), ('Chikkaballapura'), ('Chikkamagaluru'), ('Chitradurga'),
  ('Dakshina Kannada'), ('Davanagere'), ('Dharwad'), ('Gadag'), ('Hassan'), ('Haveri'),
  ('Kalaburagi'), ('Kodagu'), ('Kolar'), ('Koppal'), ('Mandya'), ('Mysuru'),
  ('Raichur'), ('Ramanagara'), ('Shivamogga'), ('Tumakuru'), ('Udupi'),
  ('Uttara Kannada'), ('Vijayanagara'), ('Vijayapura'), ('Yadgir')
) AS d(name) WHERE s.code = 'KA' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 12. KERALA (KL)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Alappuzha'), ('Ernakulam'), ('Idukki'), ('Kannur'), ('Kasaragod'), ('Kollam'),
  ('Kottayam'), ('Kozhikode'), ('Malappuram'), ('Palakkad'), ('Pathanamthitta'),
  ('Thiruvananthapuram'), ('Thrissur'), ('Wayanad')
) AS d(name) WHERE s.code = 'KL' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 13. MADHYA PRADESH (MP)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Agar Malwa'), ('Alirajpur'), ('Anuppur'), ('Ashoknagar'), ('Balaghat'),
  ('Barwani'), ('Betul'), ('Bhind'), ('Bhopal'), ('Burhanpur'), ('Chhatarpur'),
  ('Chhindwara'), ('Damoh'), ('Datia'), ('Dewas'), ('Dhar'), ('Dindori'), ('Guna'),
  ('Gwalior'), ('Harda'), ('Indore'), ('Jabalpur'), ('Jhabua'), ('Katni'),
  ('Khandwa'), ('Khargone'), ('Maihar'), ('Mandla'), ('Mandsaur'), ('Mauganj'),
  ('Morena'), ('Narmadapuram'), ('Narsinghpur'), ('Neemuch'), ('Niwari'), ('Pandhurna'),
  ('Panna'), ('Raisen'), ('Rajgarh'), ('Ratlam'), ('Rewa'), ('Sagar'), ('Satna'),
  ('Sehore'), ('Seoni'), ('Shahdol'), ('Shajapur'), ('Sheopur'), ('Shivpuri'),
  ('Sidhi'), ('Singrauli'), ('Tikamgarh'), ('Ujjain'), ('Umaria'), ('Vidisha')
) AS d(name) WHERE s.code = 'MP' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 14. MAHARASHTRA (MH)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Ahilyanagar'), ('Akola'), ('Amravati'), ('Beed'), ('Bhandara'), ('Buldhana'),
  ('Chandrapur'), ('Chhatrapati Sambhajinagar'), ('Dharashiv'), ('Dhule'), ('Gadchiroli'),
  ('Gondia'), ('Hingoli'), ('Jalgaon'), ('Jalna'), ('Kolhapur'), ('Latur'),
  ('Mumbai City'), ('Mumbai Suburban'), ('Nagpur'), ('Nanded'), ('Nandurbar'),
  ('Nashik'), ('Palghar'), ('Parbhani'), ('Pune'), ('Raigad'), ('Ratnagiri'),
  ('Sangli'), ('Satara'), ('Sindhudurg'), ('Solapur'), ('Thane'), ('Wardha'),
  ('Washim'), ('Yavatmal')
) AS d(name) WHERE s.code = 'MH' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 15. MANIPUR (MN)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Bishnupur'), ('Chandel'), ('Churachandpur'), ('Imphal East'), ('Imphal West'),
  ('Jiribam'), ('Kakching'), ('Kamjong'), ('Kangpokpi'), ('Noney'), ('Pherzawl'),
  ('Senapati'), ('Tamenglong'), ('Tengnoupal'), ('Thoubal'), ('Ukhrul')
) AS d(name) WHERE s.code = 'MN' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 16. MEGHALAYA (ML)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('East Garo Hills'), ('East Jaintia Hills'), ('East Khasi Hills'),
  ('Eastern West Khasi Hills'), ('North Garo Hills'), ('Ri Bhoi'),
  ('South Garo Hills'), ('South West Garo Hills'), ('South West Khasi Hills'),
  ('West Garo Hills'), ('West Jaintia Hills'), ('West Khasi Hills')
) AS d(name) WHERE s.code = 'ML' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 17. MIZORAM (MZ)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Aizawl'), ('Champhai'), ('Hnahthial'), ('Khawzawl'), ('Kolasib'),
  ('Lawngtlai'), ('Lunglei'), ('Mamit'), ('Saitual'), ('Serchhip'), ('Siaha')
) AS d(name) WHERE s.code = 'MZ' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 18. NAGALAND (NL)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Chumoukedima'), ('Dimapur'), ('Kiphire'), ('Kohima'), ('Longleng'),
  ('Mokokchung'), ('Mon'), ('Niuland'), ('Noklak'), ('Peren'), ('Phek'),
  ('Shamator'), ('Tseminyu'), ('Tuensang'), ('Wokha'), ('Zunheboto')
) AS d(name) WHERE s.code = 'NL' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 19. ODISHA (OD)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Angul'), ('Balangir'), ('Balasore'), ('Bargarh'), ('Bhadrak'), ('Boudh'),
  ('Cuttack'), ('Deogarh'), ('Dhenkanal'), ('Gajapati'), ('Ganjam'), ('Jagatsinghpur'),
  ('Jajpur'), ('Jharsuguda'), ('Kalahandi'), ('Kandhamal'), ('Kendrapara'), ('Kendujhar'),
  ('Khordha'), ('Koraput'), ('Malkangiri'), ('Mayurbhanj'), ('Nabarangpur'),
  ('Nayagarh'), ('Nuapada'), ('Puri'), ('Rayagada'), ('Sambalpur'), ('Subarnapur'), ('Sundargarh')
) AS d(name) WHERE s.code = 'OD' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 20. PUNJAB (PB)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Amritsar'), ('Barnala'), ('Bathinda'), ('Faridkot'), ('Fatehgarh Sahib'),
  ('Fazilka'), ('Firozpur'), ('Gurdaspur'), ('Hoshiarpur'), ('Jalandhar'),
  ('Kapurthala'), ('Ludhiana'), ('Malerkotla'), ('Mansa'), ('Moga'), ('Pathankot'),
  ('Patiala'), ('Rupnagar'), ('Sahibzada Ajit Singh Nagar'), ('Sangrur'),
  ('Shahid Bhagat Singh Nagar'), ('Sri Muktsar Sahib'), ('Tarn Taran')
) AS d(name) WHERE s.code = 'PB' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 21. RAJASTHAN (RJ)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Ajmer'), ('Alwar'), ('Anupgarh'), ('Banswara'), ('Baran'), ('Barmer'), ('Balotra'),
  ('Beawar'), ('Bharatpur'), ('Bhilwara'), ('Bikaner'), ('Bundi'), ('Chittorgarh'),
  ('Churu'), ('Dausa'), ('Deeg'), ('Dholpur'), ('Didwana-Kuchaman'), ('Dudu'),
  ('Dungarpur'), ('Gangapur City'), ('Hanumangarh'), ('Jaipur'), ('Jaipur Rural'),
  ('Jaisalmer'), ('Jalore'), ('Jhalawar'), ('Jhunjhunu'), ('Jodhpur'), ('Jodhpur Rural'),
  ('Karauli'), ('Kekri'), ('Khairthal-Tijara'), ('Kota'), ('Kotputli-Behror'),
  ('Nagaur'), ('Neem Ka Thana'), ('Pali'), ('Phalodi'), ('Pratapgarh'), ('Rajsamand'),
  ('Salumbar'), ('Sanchore'), ('Sawai Madhopur'), ('Shahpura'), ('Sikar'), ('Sirohi'),
  ('Sri Ganganagar'), ('Tonk'), ('Udaipur')
) AS d(name) WHERE s.code = 'RJ' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 22. SIKKIM (SK)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Gangtok'), ('Gyalshing'), ('Mangan'), ('Namchi'), ('Pakyong'), ('Soreng')
) AS d(name) WHERE s.code = 'SK' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 23. TAMIL NADU (TN)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Ariyalur'), ('Chengalpattu'), ('Chennai'), ('Coimbatore'), ('Cuddalore'),
  ('Dharmapuri'), ('Dindigul'), ('Erode'), ('Kallakurichi'), ('Kanchipuram'),
  ('Kanyakumari'), ('Karur'), ('Krishnagiri'), ('Madurai'), ('Mayiladuthurai'),
  ('Nagapattinam'), ('Namakkal'), ('Nilgiris'), ('Perambalur'), ('Pudukkottai'),
  ('Ramanathapuram'), ('Ranipet'), ('Salem'), ('Sivaganga'), ('Tenkasi'), ('Thanjavur'),
  ('Theni'), ('Thoothukudi'), ('Tiruchirappalli'), ('Tirunelveli'), ('Tirupathur'),
  ('Tiruppur'), ('Tiruvallur'), ('Tiruvannamalai'), ('Tiruvarur'), ('Vellore'),
  ('Viluppuram'), ('Virudhunagar')
) AS d(name) WHERE s.code = 'TN' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 24. TELANGANA (TG)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Adilabad'), ('Bhadradri Kothagudem'), ('Hanumakonda'), ('Hyderabad'),
  ('Jagtial'), ('Jangaon'), ('Jayashankar Bhupalpally'), ('Jogulamba Gadwal'),
  ('Kamareddy'), ('Karimnagar'), ('Khammam'), ('Kumuram Bheem Asifabad'),
  ('Mahabubabad'), ('Mahabubnagar'), ('Mancherial'), ('Medak'), ('Medchal-Malkajgiri'),
  ('Mulugu'), ('Nagarkurnool'), ('Nalgonda'), ('Narayanpet'), ('Nirmal'),
  ('Nizamabad'), ('Peddapalli'), ('Rajanna Sircilla'), ('Ranga Reddy'),
  ('Sangareddy'), ('Siddipet'), ('Suryapet'), ('Vikarabad'), ('Wanaparthy'),
  ('Warangal'), ('Yadadri Bhuvanagiri')
) AS d(name) WHERE s.code = 'TG' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 25. TRIPURA (TR)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Dhalai'), ('Gomati'), ('Khowai'), ('North Tripura'), ('Sepahijala'),
  ('South Tripura'), ('Unakoti'), ('West Tripura')
) AS d(name) WHERE s.code = 'TR' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 26. UTTAR PRADESH (UP)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Agra'), ('Aligarh'), ('Ambedkar Nagar'), ('Amethi'), ('Amroha'), ('Auraiya'),
  ('Ayodhya'), ('Azamgarh'), ('Baghpat'), ('Bahraich'), ('Ballia'), ('Balrampur'),
  ('Banda'), ('Barabanki'), ('Bareilly'), ('Basti'), ('Bhadohi'), ('Bijnor'),
  ('Budaun'), ('Bulandshahr'), ('Chandauli'), ('Chitrakoot'), ('Deoria'), ('Etah'),
  ('Etawah'), ('Farrukhabad'), ('Fatehpur'), ('Firozabad'), ('Gautam Buddh Nagar'),
  ('Ghaziabad'), ('Ghazipur'), ('Gonda'), ('Gorakhpur'), ('Hamirpur'), ('Hapur'),
  ('Hardoi'), ('Hathras'), ('Jalaun'), ('Jaunpur'), ('Jhansi'), ('Kannauj'),
  ('Kanpur Dehat'), ('Kanpur Nagar'), ('Kasganj'), ('Kaushambi'), ('Kheri'),
  ('Kushinagar'), ('Lalitpur'), ('Lucknow'), ('Maharajganj'), ('Mahoba'), ('Mainpuri'),
  ('Mathura'), ('Mau'), ('Meerut'), ('Mirzapur'), ('Moradabad'), ('Muzaffarnagar'),
  ('Pilibhit'), ('Pratapgarh'), ('Prayagraj'), ('Raebareli'), ('Rampur'), ('Saharanpur'),
  ('Sambhal'), ('Sant Kabir Nagar'), ('Shahjahanpur'), ('Shamli'), ('Shravasti'),
  ('Siddharthnagar'), ('Sitapur'), ('Sonbhadra'), ('Sultanpur'), ('Unnao'), ('Varanasi')
) AS d(name) WHERE s.code = 'UP' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 27. UTTARAKHAND (UK)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Almora'), ('Bageshwar'), ('Chamoli'), ('Champawat'), ('Dehradun'), ('Haridwar'),
  ('Nainital'), ('Pauri Garhwal'), ('Pithoragarh'), ('Rudraprayag'), ('Tehri Garhwal'),
  ('Udham Singh Nagar'), ('Uttarkashi')
) AS d(name) WHERE s.code = 'UK' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 28. WEST BENGAL (WB)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Alipurduar'), ('Bankura'), ('Birbhum'), ('Cooch Behar'), ('Dakshin Dinajpur'),
  ('Darjeeling'), ('Hooghly'), ('Howrah'), ('Jalpaiguri'), ('Jhargram'), ('Kalimpong'),
  ('Kolkata'), ('Malda'), ('Murshidabad'), ('Nadia'), ('North 24 Parganas'),
  ('Paschim Bardhaman'), ('Paschim Medinipur'), ('Purba Bardhaman'), ('Purba Medinipur'),
  ('Purulia'), ('South 24 Parganas'), ('Uttar Dinajpur')
) AS d(name) WHERE s.code = 'WB' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 29. ANDAMAN AND NICOBAR ISLANDS (AN)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Nicobar'), ('North and Middle Andaman'), ('South Andaman')
) AS d(name) WHERE s.code = 'AN' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 30. CHANDIGARH (CH)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Chandigarh')
) AS d(name) WHERE s.code = 'CH' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 31. DADRA AND NAGAR HAVELI AND DAMAN AND DIU (DH)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Dadra and Nagar Haveli'), ('Daman'), ('Diu')
) AS d(name) WHERE s.code = 'DH' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 32. DELHI (DL)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Central Delhi'), ('East Delhi'), ('New Delhi'), ('North Delhi'), ('North East Delhi'),
  ('North West Delhi'), ('Shahdara'), ('South Delhi'), ('South East Delhi'),
  ('South West Delhi'), ('West Delhi')
) AS d(name) WHERE s.code = 'DL' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 33. JAMMU AND KASHMIR (JK)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Anantnag'), ('Bandipora'), ('Baramulla'), ('Budgam'), ('Doda'), ('Ganderbal'),
  ('Jammu'), ('Kathua'), ('Kishtwar'), ('Kulgam'), ('Kupwara'), ('Poonch'),
  ('Pulwama'), ('Rajouri'), ('Ramban'), ('Reasi'), ('Samba'), ('Shopian'), ('Srinagar'), ('Udhampur')
) AS d(name) WHERE s.code = 'JK' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 34. LADAKH (LA)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Kargil'), ('Leh')
) AS d(name) WHERE s.code = 'LA' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 35. LAKSHADWEEP (LD)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Lakshadweep')
) AS d(name) WHERE s.code = 'LD' ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- 36. PUDUCHERRY (PY)
-- ============================================================
INSERT INTO geo_districts (state_id, name)
SELECT s.id, d.name FROM geo_states s CROSS JOIN (VALUES
  ('Karaikal'), ('Mahe'), ('Puducherry'), ('Yanam')
) AS d(name) WHERE s.code = 'PY' ON CONFLICT (state_id, name) DO NOTHING;


-- ============================================================
-- KEY CITIES FOR MAJOR DISTRICTS
-- ============================================================
INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Patna'), ('Danapur')
) AS c(name) WHERE s.code = 'BR' AND d.name = 'Patna' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Gaya')
) AS c(name) WHERE s.code = 'BR' AND d.name = 'Gaya' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Ludhiana')
) AS c(name) WHERE s.code = 'PB' AND d.name = 'Ludhiana' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Amritsar')
) AS c(name) WHERE s.code = 'PB' AND d.name = 'Amritsar' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Gurugram')
) AS c(name) WHERE s.code = 'HR' AND d.name = 'Gurugram' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Faridabad')
) AS c(name) WHERE s.code = 'HR' AND d.name = 'Faridabad' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Bhubaneswar')
) AS c(name) WHERE s.code = 'OD' AND d.name = 'Khordha' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Cuttack')
) AS c(name) WHERE s.code = 'OD' AND d.name = 'Cuttack' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Bhopal')
) AS c(name) WHERE s.code = 'MP' AND d.name = 'Bhopal' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Indore')
) AS c(name) WHERE s.code = 'MP' AND d.name = 'Indore' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Guwahati')
) AS c(name) WHERE s.code = 'AS' AND d.name = 'Kamrup Metropolitan' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Shimla')
) AS c(name) WHERE s.code = 'HP' AND d.name = 'Shimla' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Dehradun')
) AS c(name) WHERE s.code = 'UK' AND d.name = 'Dehradun' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Ranchi')
) AS c(name) WHERE s.code = 'JH' AND d.name = 'Ranchi' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Raipur')
) AS c(name) WHERE s.code = 'CG' AND d.name = 'Raipur' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Srinagar')
) AS c(name) WHERE s.code = 'JK' AND d.name = 'Srinagar' ON CONFLICT (district_id, name) DO NOTHING;

INSERT INTO geo_cities (district_id, name)
SELECT d.id, c.name FROM geo_districts d JOIN geo_states s ON d.state_id = s.id CROSS JOIN (VALUES
  ('Jammu')
) AS c(name) WHERE s.code = 'JK' AND d.name = 'Jammu' ON CONFLICT (district_id, name) DO NOTHING;
