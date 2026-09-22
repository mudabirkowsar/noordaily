// utils/validation.js
// Lightweight runtime validation for content records. These guard against
// malformed entries in data/quran.js and data/hadith.js so the app never
// crashes on missing fields, and so incomplete demo records are easy to spot.

/**
 * @param {object} ayah
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateQuranAyah(ayah) {
  const errors = [];
  if (!ayah || typeof ayah !== 'object') {
    return { valid: false, errors: ['Ayah record is missing or not an object'] };
  }
  if (!ayah.id) errors.push('Missing id');
  if (!ayah.surahNumber) errors.push('Missing surahNumber');
  if (!ayah.surahName) errors.push('Missing surahName');
  if (!ayah.ayahNumber) errors.push('Missing ayahNumber');
  if (!ayah.arabic) errors.push('Missing arabic text');
  if (!ayah.translation) errors.push('Missing translation');

  return { valid: errors.length === 0, errors };
}

/**
 * @param {object} hadith
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateHadith(hadith) {
  const errors = [];
  if (!hadith || typeof hadith !== 'object') {
    return { valid: false, errors: ['Hadith record is missing or not an object'] };
  }
  if (!hadith.id) errors.push('Missing id');
  if (!hadith.collection) errors.push('Missing collection');
  if (!hadith.hadithNumber) errors.push('Missing hadithNumber');
  if (!hadith.translation) errors.push('Missing translation');

  return { valid: errors.length === 0, errors };
}

/**
 * @param {object} content - { date, ayah, hadith }
 */
export function validateDailyContent(content) {
  const errors = [];
  if (!content || typeof content !== 'object') {
    return { valid: false, errors: ['Daily content record is missing or not an object'] };
  }
  if (!content.date || !/^\d{4}-\d{2}-\d{2}$/.test(content.date)) {
    errors.push('date must be in yyyy-MM-dd format');
  }
  const ayahCheck = validateQuranAyah(content.ayah);
  const hadithCheck = validateHadith(content.hadith);
  if (!ayahCheck.valid) errors.push(...ayahCheck.errors.map((e) => `ayah: ${e}`));
  if (!hadithCheck.valid) errors.push(...hadithCheck.errors.map((e) => `hadith: ${e}`));

  return { valid: errors.length === 0, errors };
}

export default { validateQuranAyah, validateHadith, validateDailyContent };
