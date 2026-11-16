import {readJsonl} from './utils.mjs';
export async function loadQuran(root){return readJsonl(`${root}/data/corpora/quran/quran_normalized.jsonl`)}
export function verifyQuran(records){const surahs=new Set(records.map(x=>x.surah)); if(records.length!==6236)throw new Error(`Expected 6236 records, got ${records.length}`); if(surahs.size!==114)throw new Error(`Expected 114 surahs, got ${surahs.size}`); return{records:records.length,surahs:surahs.size,ok:true}}
function normalizeArabic(s){return s.normalize('NFKC').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/[ٱأإآ]/g,'ا').toLowerCase()}
export function searchQuran(records,q,limit=25){const n=normalizeArabic(q);return records.filter(x=>normalizeArabic(x.text_uthmani).includes(n)||x.surah_name.toLowerCase().includes(q.toLowerCase())).slice(0,limit)}
