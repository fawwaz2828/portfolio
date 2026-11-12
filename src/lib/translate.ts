/**
 * English → Simplified Chinese for the admin dashboard, so a new project gets
 * its 中文 text without typing it by hand. Uses MyMemory's free public endpoint
 * (no key; about 5,000 characters a day, 500 per request). It is only a first
 * draft: the result lands in an editable field, and if the service is down the
 * field just stays empty and the site shows the English text.
 */
const ENDPOINT = "https://api.mymemory.translated.net/get";
const MAX = 450;

/** Sentence-sized pieces that fit in one request. */
function chunks(text: string) {
  const out: string[] = [];
  let cur = "";
  for (const s of text.match(/[^.!?\n]+[.!?\n]*\s*/g) ?? [text]) {
    if (cur && (cur + s).length > MAX) { out.push(cur); cur = ""; }
    cur += s;
    while (cur.length > MAX) { out.push(cur.slice(0, MAX)); cur = cur.slice(MAX); }
  }
  if (cur) out.push(cur);
  return out;
}

async function one(text: string) {
  const res = await fetch(`${ENDPOINT}?q=${encodeURIComponent(text)}&langpair=en|zh-CN`);
  if (!res.ok) throw new Error(`Translation service answered ${res.status}`);
  const json = await res.json();
  // errors (quota, length) come back as text in translatedText with a non-200 responseStatus
  if (Number(json.responseStatus) !== 200) throw new Error(String(json.responseDetails || json.responseData?.translatedText || "Translation failed"));
  return String(json.responseData.translatedText);
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Date labels ("2025 — Now", "Sep 2025 — Present", "Mar — May 2022") are
 * translated here: machine translation tends to mangle them. Returns null
 * for anything that is not a date label.
 */
export function dateToChinese(text: string): string | null {
  // "now" is tried before the month names, which would otherwise swallow it
  const token = /^(?:(\d{4})|(?=now$|present$|today$)(now|present|today)|([A-Za-z]{3})[a-z]*\.?(?:\s+(\d{4}))?)$/i;
  const parts = text.split(/\s*[—–-]\s*/);
  if (!parts.length || parts.length > 2) return null;
  const out: string[] = [];
  for (const raw of parts) {
    const m = raw.trim().match(token);
    if (!m) return null;
    if (m[1]) out.push(m[1]);
    else if (m[2]) out.push("至今");
    else {
      const mi = MONTHS.indexOf(m[3].toLowerCase());
      if (mi < 0) return null;
      out.push(m[4] ? `${m[4]}年${mi + 1}月` : `${mi + 1}月`);
    }
  }
  // "3月 — 2022年5月" reads better with the year up front: "2022年3月 — 5月"
  const year = out[1]?.match(/^(\d{4})年/);
  if (year && /^\d+月$/.test(out[0])) { out[0] = year[1] + "年" + out[0]; out[1] = out[1].slice(5); }
  return out.join(" — ");
}

/** Parts around " · " are translated on their own so "Role · 2026" keeps its shape. */
export async function toChinese(text: string): Promise<string> {
  const asDate = dateToChinese(text.trim());
  if (asDate !== null) return asDate;
  const parts = await Promise.all(
    text.split(" · ").map(async (part) => {
      if (!/[A-Za-z]/.test(part)) return part; // a year, an emoji: nothing to translate
      const done: string[] = [];
      for (const c of chunks(part.trim())) done.push((await one(c.trim())).trim());
      return done.join("");
    }),
  );
  return parts.join(" · ");
}
