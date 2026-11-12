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

/** Parts around " · " are translated on their own so "Role · 2026" keeps its shape. */
export async function toChinese(text: string): Promise<string> {
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
