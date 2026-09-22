// services/dailyContentService.js
//
// Deterministically maps a calendar date to one Ayah and one Hadith, so the
// same date always produces the same content (no randomness at read time).
// Keeps all "which content for which day" logic out of the UI layer.

import { quranAyahs } from '../data/quran';
import { hadiths } from '../data/hadith';
import { getDayOfYearIndex, toDateKey } from '../utils/dateUtils';
import { validateQuranAyah, validateHadith } from '../utils/validation';

/**
 * Returns the Ayah scheduled for the given date. Deterministic: the same
 * date always resolves to the same ayah, using (day-of-year mod pool size).
 * @param {Date} date
 */
export function getDailyAyah(date) {
  if (!quranAyahs.length) return null;
  const dayIndex = getDayOfYearIndex(date);
  const idx = (dayIndex - 1) % quranAyahs.length;
  const ayah = quranAyahs[idx];
  const check = validateQuranAyah(ayah);
  if (!check.valid) {
    console.warn('Invalid ayah record for date', toDateKey(date), check.errors);
  }
  return ayah;
}

/**
 * Returns the Hadith scheduled for the given date. Deterministic in the
 * same way as getDailyAyah.
 * @param {Date} date
 */
export function getDailyHadith(date) {
  if (!hadiths.length) return null;
  const dayIndex = getDayOfYearIndex(date);
  const idx = (dayIndex - 1) % hadiths.length;
  const hadith = hadiths[idx];
  const check = validateHadith(hadith);
  if (!check.valid) {
    console.warn('Invalid hadith record for date', toDateKey(date), check.errors);
  }
  return hadith;
}

/**
 * Returns { date, ayah, hadith } for the given date.
 * @param {Date} date
 */
export function getDailyContent(date) {
  return {
    date: toDateKey(date),
    ayah: getDailyAyah(date),
    hadith: getDailyHadith(date),
  };
}

/**
 * Finds an ayah by its id across the whole pool (used by /ayah/[id]).
 */
export function getAyahById(id) {
  return quranAyahs.find((a) => a.id === id) || null;
}

/**
 * Finds a hadith by its id across the whole pool (used by /hadith/[id]).
 */
export function getHadithById(id) {
  return hadiths.find((h) => h.id === id) || null;
}

export default {
  getDailyAyah,
  getDailyHadith,
  getDailyContent,
  getAyahById,
  getHadithById,
};
