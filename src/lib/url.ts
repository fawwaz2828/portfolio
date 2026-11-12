/**
 * Project links are typed by hand in /admin, often without the scheme
 * ("dpm.uii.ac.id"). A bare domain would be read as a path on this site, so
 * add https:// to anything that is not already absolute, a site path or an anchor.
 */
export const toHref = (raw: string) => {
  const v = raw.trim();
  if (!v) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(v) || v.startsWith("/") || v.startsWith("#")) return v;
  return `https://${v}`;
};
