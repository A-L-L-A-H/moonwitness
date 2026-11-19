"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown } from "@moonwitness/ui/icons";
import { SanctuaryGateLink } from "@/components/sanctuary-gate-link";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";
import { getLocaleFromPath, getLocalizedUrl } from "@/utils/i18n";

export function LandingFooter() {
  const pathname = usePathname() ?? "";
  const pathLocale = getLocaleFromPath(pathname);
  const { locale } = useSanctuaryLocale();
  const toHref = (slug: string) => (pathLocale ? getLocalizedUrl(slug, pathLocale) : slug);

  return (
    <footer className="border-t-2 border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-6 text-[var(--accent)]" />
          <span className="font-brush text-sm text-[var(--card-foreground)]">
            MOON<span className="text-[var(--primary)]">WITNESS</span>
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {locale === "id"
              ? "// Cipta · Kurasi · Terbitkan"
              : locale === "ar"
                ? "// إبداع · توثيق · نشر"
                : "// Create · Curate · Publish"}
          </span>
        </div>
        <nav
          className="flex flex-wrap gap-5 text-xs text-[var(--muted-foreground)]"
          aria-label="Footer"
        >
          <SanctuaryGateLink className="hover:text-[var(--yellow)] max-lg:min-h-11">
            A-L-L-A-H
          </SanctuaryGateLink>
          <Link href={toHref("/dock")} className="hover:text-[var(--pink)] max-lg:min-h-11">
            {locale === "id" ? "Arsip" : locale === "ar" ? "الأرشيف" : "Archive"}
          </Link>
          <Link href={toHref("/shadow")} className="hover:text-[var(--pink)] max-lg:min-h-11">
            {locale === "id" ? "Bayangan" : locale === "ar" ? "البوابة الخفية" : "The Shadow"}
          </Link>
          <Link href={toHref("/mission-control")} className="hover:text-[var(--pink)] max-lg:min-h-11">
            {locale === "id" ? "Kendali Misi" : locale === "ar" ? "مركز القيادة" : "Mission Control"}
          </Link>
          <a href="#home" className="hover:text-[var(--pink)] max-lg:min-h-11">
            {locale === "id" ? "Kembali ke atas ↑" : locale === "ar" ? "العودة للأعلى ↑" : "Back to top ↑"}
          </a>
        </nav>
      </div>
    </footer>
  );
}
