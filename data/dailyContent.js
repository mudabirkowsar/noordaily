// data/dailyContent.js
//
// Pulls together the raw quran.js and hadith.js arrays. The actual
// deterministic "which ayah/hadith for which date" logic lives in
// services/dailyContentService.js — this file only exposes the raw pools.

import { quranAyahs } from './quran';
import { hadiths } from './hadith';

export const CONTENT_POOLS = {
  ayahs: quranAyahs,
  hadiths: hadiths,
};

export default CONTENT_POOLS;
