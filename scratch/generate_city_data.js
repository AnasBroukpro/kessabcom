/**
 * BUILD SCRIPT: generate_city_data.js
 * 
 * Reads the local morocco-cities-master/all.json dataset (393 cities with AR/FR/EN names)
 * and merges it with the existing cityCoords (from the current cityMapping.ts) to
 * produce a clean, complete newCityMapping.ts.
 *
 * Run: node scratch/generate_city_data.js
 * Output: e:\Antigravity\Projects antigravity\Kessabcom\src\constants\cityMapping.ts
 */

const fs = require('fs');
const path = require('path');

// ─── 1. Load sources ─────────────────────────────────────────────────────────

const allJsonPath  = 'C:\\Users\\PC\\Downloads\\morocco-cities-master\\morocco-cities-master\\all.json';
const currentTsPath = 'e:\\Antigravity\\Projects antigravity\\Kessabcom\\src\\constants\\cityMapping.ts';
const outPath = currentTsPath;

const allData    = JSON.parse(fs.readFileSync(allJsonPath, 'utf8'));
const currentRaw = fs.readFileSync(currentTsPath, 'utf8');

// ─── 2. Parse current cityCoords from TS source ─────────────────────────────

const coordsMatch = currentRaw.match(/export const cityCoords[^=]+=\s*(\{[\s\S]+?\});\s*\n/);
if (!coordsMatch) { console.error('Cannot parse cityCoords'); process.exit(1); }
const currentCoords = eval('(' + coordsMatch[1] + ')');
console.log(`Existing coords entries: ${Object.keys(currentCoords).length}`);

// ─── 3. Build region lookup (id → { ar, en, fr }) ───────────────────────────

const regionById = {};
allData.regions.data.forEach(r => {
  regionById[r.id] = r.names;
});

// ─── 4. Build comprehensive city list ────────────────────────────────────────

// We want to produce a list where:
//   - key  = Arabic name (used everywhere in UI)
//   - value = { lat, lng, nameFr, nameEn, region_ar }
//
// Priority for coords:
//   a) exact match by Arabic name in currentCoords
//   b) match by French name in currentCoords (some entries stored under FR key)
//   c) no coords → city still included, getClosestCity still works at query time
//      (these are fringe localities; major cities always have coords)

const newCityCoords = {}; // key = arabic name
const newCityMapping = {}; // key = french name (lowercased) → arabic name
const newCityMeta = [];   // enriched entries for documentation / future use

// Known coordinate overrides for very common cities that may be missing or wrong
const COORD_OVERRIDES = {
  'الدار البيضاء': { lat: 33.5731, lng: -7.5898 },
  'الرباط':        { lat: 34.0209, lng: -6.8416 },
  'مراكش':         { lat: 31.6295, lng: -7.9811 },
  'فاس':           { lat: 34.0181, lng: -5.0078 },
  'طنجة':          { lat: 35.7595, lng: -5.8340 },
  'مكناس':         { lat: 33.8936, lng: -5.5473 },
  'سطات':          { lat: 33.0015, lng: -7.6194 },
  'وجدة':          { lat: 34.6814, lng: -1.9086 },
  'أكادير':        { lat: 30.4278, lng: -9.5981 },
  'تطوان':         { lat: 35.5785, lng: -5.3684 },
  'الجديدة':       { lat: 33.2561, lng: -8.5073 },
  'القنيطرة':      { lat: 34.2610, lng: -6.5802 },
  'تمارة':         { lat: 33.8487, lng: -6.9139 },
  'سلا':           { lat: 34.0375, lng: -6.7980 },
  'خريبكة':        { lat: 32.8908, lng: -6.5634 },
  'برشيد':         { lat: 33.2671, lng: -7.5870 },
  'خنيفرة':        { lat: 32.9347, lng: -5.6673 },
  'بني ملال':      { lat: 32.3373, lng: -6.3499 },
  'الحسيمة':       { lat: 35.2517, lng: -3.9372 },
  'تازة':          { lat: 34.2099, lng: -4.0116 },
  'الناظور':       { lat: 35.1740, lng: -2.9289 },
  'الراشيدية':     { lat: 31.9313, lng: -4.4278 },
  'زاكورة':        { lat: 30.4676, lng: -5.8894 },
  'ورزازات':       { lat: 30.9189, lng: -6.8934 },
  'أسفي':          { lat: 32.2994, lng: -9.2372 },
  'تيزنيت':        { lat: 29.6980, lng: -9.7320 },
  'إنزكان':        { lat: 30.3614, lng: -9.5377 },
  'لارش':          { lat: 35.1939, lng: -5.2785 },
  'الدريوش':       { lat: 34.9833, lng: -3.3833 },
};

// Track seen arabic names to avoid duplicates
const seenAr = new Set();

allData.cities.data.forEach((city, idx) => {
  const ar = (city.names.ar || '').trim();
  const fr = (city.names.fr || '').trim();
  const en = (city.names.en || '').trim();
  const regionId = city.region_id;
  const region = regionById[regionId] || {};

  if (!ar && !fr) return; // skip entries with no name at all

  // Use arabic name if available; fall back to french
  const primaryName = ar || fr;

  // Avoid duplicates by arabic name
  if (ar && seenAr.has(ar)) return;
  if (ar) seenAr.add(ar);

  // ── Find coordinates ──
  let coords = null;

  // Priority 1: override table
  if (ar && COORD_OVERRIDES[ar]) {
    coords = COORD_OVERRIDES[ar];
  }
  // Priority 2: existing coords by arabic name
  else if (ar && currentCoords[ar]) {
    coords = currentCoords[ar];
  }
  // Priority 3: existing coords by french name
  else if (fr && currentCoords[fr]) {
    coords = currentCoords[fr];
  }
  // Priority 4: walk existing coords to find case-insensitive match on french
  else if (fr) {
    const frLower = fr.toLowerCase();
    for (const [k, v] of Object.entries(currentCoords)) {
      if (k.toLowerCase() === frLower) { coords = v; break; }
    }
  }
  // Priority 5: match by english name
  else if (en) {
    const enLower = en.toLowerCase();
    for (const [k, v] of Object.entries(currentCoords)) {
      if (k.toLowerCase() === enLower) { coords = v; break; }
    }
  }

  if (coords) {
    newCityCoords[primaryName] = { lat: coords.lat, lng: coords.lng };
  }

  // Always add to mapping (fr → ar) even without coords
  if (fr && ar) {
    newCityMapping[fr] = ar;
    newCityMapping[fr.toLowerCase()] = ar;
  }
  if (en && ar) {
    newCityMapping[en] = ar;
    newCityMapping[en.toLowerCase()] = ar;
  }

  newCityMeta.push({
    ar: primaryName,
    fr: fr || null,
    en: en || null,
    region_ar: region.ar || null,
    region_fr: region.fr || null,
    hasCoords: !!coords,
  });
});

// ─── 5. Add back any cities that were in currentCoords but NOT in all.json ──

let extra = 0;
for (const [arName, coords] of Object.entries(currentCoords)) {
  if (!newCityCoords[arName] && arName.trim()) {
    newCityCoords[arName] = coords;
    extra++;
  }
}
console.log(`Added ${extra} extra cities from existing coords that were not in all.json`);

// ─── 6. Apply coord overrides ────────────────────────────────────────────────
for (const [arName, coords] of Object.entries(COORD_OVERRIDES)) {
  newCityCoords[arName] = coords;
}

// ─── 7. Sort ─────────────────────────────────────────────────────────────────

const sortedCoords = {};
Object.keys(newCityCoords).sort().forEach(k => { sortedCoords[k] = newCityCoords[k]; });

const sortedMapping = {};
Object.keys(newCityMapping).sort().forEach(k => { sortedMapping[k] = newCityMapping[k]; });

// ─── 8. Stats ─────────────────────────────────────────────────────────────────
const withCoords = Object.keys(sortedCoords).length;
const total = newCityMeta.length;
const withCoordsCount = newCityMeta.filter(m => m.hasCoords).length;
console.log(`\n📊 STATS:`);
console.log(`  Total cities from all.json: ${total}`);
console.log(`  Cities with coords:         ${withCoordsCount} / ${total}`);
console.log(`  cityCoords entries:         ${withCoords}`);
console.log(`  cityMapping entries:        ${Object.keys(sortedMapping).length}`);

// ─── 9. Generate TypeScript output ───────────────────────────────────────────

const coordsJson = JSON.stringify(sortedCoords, null, 2);
const mappingJson = JSON.stringify(sortedMapping, null, 2);

const tsOutput = `// AUTO-GENERATED — do not edit manually.
// Source: mehdibo/morocco-cities (all.json) merged with existing coordinate data.
// Regenerate with: node scratch/generate_city_data.js
//
// ARCHITECTURE:
//   cityCoords  — Arabic name → { lat, lng }   (used for: proximity search, map pins)
//   cityMapping — French/English name → Arabic   (used for: normalizing stored data)
//   getClosestCity(lat, lng) — local Haversine reverse-geocoding, no external API
//   getDisplayCity(listing)  — resolves stored location string to Arabic city name
//   normalizeArabic(str)     — strips diacritics, unifies alef/ya/ta marbuta variants

// ─── City coordinates (Arabic name → { lat, lng }) ───────────────────────────
export const cityCoords: { [key: string]: { lat: number; lng: number } } = ${coordsJson};

// ─── French/English → Arabic name mapping ────────────────────────────────────
export const cityMapping: { [key: string]: string } = ${mappingJson};

// ─── Arabic text normalizer ───────────────────────────────────────────────────
// Strips tashkil (diacritics), unifies alef variants, ya, ta marbuta.
// Used so that "الدار البيضاء" matches "الدار البيضاء" regardless of minor spelling.
export const normalizeArabic = (str: string): string => {
  if (!str) return '';
  return str
    .trim()
    // Remove tashkil (harakat + shadda + sukun + tatweel)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // Unify alef variants → bare alef
    .replace(/[آأإٱ]/g, 'ا')
    // Unify ya variants
    .replace(/ى/g, 'ي')
    // Normalize ta marbuta → ha (tolerant matching)
    .replace(/ة/g, 'ه')
    // Collapse multiple spaces
    .replace(/\\s+/g, ' ');
};

// ─── Haversine distance (km) ──────────────────────────────────────────────────
export const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Reverse geocoding: coordinates → closest Arabic city name ───────────────
// No external API. Pure local Haversine lookup against cityCoords.
// Configurable threshold (default 100 km) avoids false positives.
export const getClosestCity = (
  lat: number,
  lng: number,
  thresholdKm = 100
): string | null => {
  // Quick sanity: broad Morocco bounding box
  if (lat < 21 || lat > 36.5 || lng < -17.5 || lng > -0.5) return null;

  let closestCity: string | null = null;
  let minDistance = Infinity;

  for (const [city, coords] of Object.entries(cityCoords)) {
    if (!city) continue;
    const d = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (d < minDistance) {
      minDistance = d;
      closestCity = city;
    }
  }

  return (closestCity && minDistance <= thresholdKm) ? closestCity : null;
};

// ─── Display resolver: stored listing location → Arabic city name ─────────────
// Tries (in order):
//   1. GPS coordinates → getClosestCity
//   2. Exact match in cityCoords (already Arabic)
//   3. Mapping lookup (French/English → Arabic)
//   4. Normalized Arabic search in cityCoords keys
//   5. Raw value fallback
export const getDisplayCity = (listing: any): string => {
  const rawLocation: string = (listing.city || listing.location || '').trim();

  // 1. GPS coordinates
  if (listing.coordinates?.lat && listing.coordinates?.lng) {
    if (!rawLocation || rawLocation === 'موقع على الخريطة') {
      const closest = getClosestCity(listing.coordinates.lat, listing.coordinates.lng);
      if (closest) return closest;
    }
  }

  if (!rawLocation) return 'غير محدد';

  // 2. Exact match in cityCoords (city is already stored in Arabic)
  if (cityCoords[rawLocation]) return rawLocation;

  // 3. Direct mapping lookup (French or English stored value)
  const mapped = cityMapping[rawLocation] || cityMapping[rawLocation.toLowerCase()];
  if (mapped) return mapped;

  // 4. Normalized Arabic comparison
  const normTarget = normalizeArabic(rawLocation);
  for (const city of Object.keys(cityCoords)) {
    if (normalizeArabic(city) === normTarget) return city;
  }

  // 5. Fallback
  return rawLocation || 'غير محدد';
};
`;

fs.writeFileSync(outPath, tsOutput, 'utf8');
console.log(`\n✅ Written to: ${outPath}`);
console.log(`   File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
