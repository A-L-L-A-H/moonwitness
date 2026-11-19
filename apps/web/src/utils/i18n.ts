import { i18n, type Locale } from "@/configs/i18n";

export function isValidLocale(value: string | null | undefined): value is Locale {
  if (!value) return false;
  return (i18n.locales as readonly string[]).includes(value);
}

export function getLocaleFromPath(pathname: string): Locale | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return isValidLocale(firstSegment) ? firstSegment : null;
}

export function isUrlMissingLocale(url: string): boolean {
  return getLocaleFromPath(url) === null;
}

export function stripLocalePrefix(pathname: string): string {
  const locale = getLocaleFromPath(pathname);
  if (!locale) return pathname || "/";
  const stripped = pathname.slice(`/${locale}`.length);
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

export function getLocalizedUrl(url: string, languageCode: string): string {
  if (!url) throw new Error("URL cannot be empty");
  const locale: Locale = isValidLocale(languageCode) ? languageCode : i18n.defaultLocale;
  if (/^https?:\/\//i.test(url) || url.startsWith("#")) {
    return url;
  }
  const normalized = url.startsWith("/") ? url : `/${url}`;
  if (!isUrlMissingLocale(normalized)) {
    const rest = stripLocalePrefix(normalized);
    return rest === "/" ? `/${locale}` : `/${locale}${rest}`;
  }
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export function getLocalePath(pathname: string, locale: Locale): string {
  return getLocalizedUrl(pathname, locale);
}
