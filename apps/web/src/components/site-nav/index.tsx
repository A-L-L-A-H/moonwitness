"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { GlobeIcon, Menu, SearchIcon, X } from "@moonwitness/ui/icons";
import { Button, DnaBrandLogo, useSkin, type BrandLogoId } from "@moonwitness/ui";
import { SanctuaryGateLink } from "@/components/sanctuary-gate-link";
import { SkinSwitcher } from "@/components/skin-switcher";
import { links } from "./links";
import { MobileMenu } from "./mobile-menu";
import { SearchDialog } from "./search-dialog";

export function SiteNav() {
  const router = useRouter();
  const { dnaId } = useSkin();
  const [active, setActive] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dismissSearch = useCallback(() => {
    setSearchOpen(false);
    requestAnimationFrame(() => searchTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const link of links) {
      const el = document.getElementById(link.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchOpen(false);
    router.push(query.trim() ? `/dock?q=${encodeURIComponent(query.trim())}` : "/dock");
  }

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 border-b-2 border-[var(--border)] bg-[var(--background)]/90 text-[var(--foreground)] backdrop-blur-md"
        onKeyDown={(event) => {
          if (menuOpen && event.key === "Escape") {
            event.preventDefault();
            setMenuOpen(false);
            menuToggleRef.current?.focus();
          }
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/moonwitness"
            className="flex items-center gap-2.5 max-lg:min-h-11"
            aria-label="Moonwitness home"
          >
            <DnaBrandLogo
              id={(dnaId as BrandLogoId) ?? "moonwitness"}
              variant="mark"
              size={28}
              decorative
            />
            <span className="font-brush text-xl tracking-wide text-[var(--foreground)] sm:text-2xl">
              MOON<span className="text-[var(--primary)]">WITNESS</span>
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Primary">
            {links.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setActive(link.id)}
                aria-current={active === link.id ? "true" : undefined}
                className={`px-3 py-1.5 font-brush text-sm tracking-wider transition-colors ${
                  active === link.id
                    ? "text-[var(--primary)] underline decoration-[var(--primary)] decoration-4 underline-offset-8"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {link.label}
              </a>
            ))}
            <SanctuaryGateLink className="whitespace-nowrap px-2.5 py-1.5 font-brush text-sm tracking-wider text-[var(--primary)] transition-colors hover:text-[var(--foreground)] xl:px-3">
              A-L-L-A-H
            </SanctuaryGateLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <SkinSwitcher />
            <button
              onClick={() => setSearchOpen(true)}
              ref={searchTriggerRef}
              aria-label="Search the archive"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            <Link
              href="/mission-control"
              aria-label="Open Mission Control"
              className="hidden rounded-md p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] sm:block"
            >
              <GlobeIcon className="h-5 w-5" />
            </Link>
            <Link href="/shadow" className="hidden sm:block">
              <Button variant="outline" size="sm" className="px-5 py-2 text-sm">
                JOIN THE CREW →
              </Button>
            </Link>
            <button
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-[var(--foreground)] lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              ref={menuToggleRef}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <MobileMenu
            links={links}
            active={active}
            onSelect={setActive}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </header>

      {searchOpen && (
        <SearchDialog
          query={query}
          onQueryChange={setQuery}
          onSubmit={submitSearch}
          onClose={dismissSearch}
        />
      )}
    </>
  );
}
