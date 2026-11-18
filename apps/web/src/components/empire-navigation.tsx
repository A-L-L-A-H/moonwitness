"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { Button } from "@moonwitness/ui";
import {
  CrescentStarIcon,
  CrownEmblemIcon,
  DnaButton,
  PrimaryAction,
  SearchLensIcon,
  SecondaryAction,
  SiteNavigation,
} from "@moonwitness/ui/imperium";
import { NAVIGATION_TABS, type NavigationSectionId } from "@/data/empire-registry";
import type { SanctuaryLocale } from "@/lib/sanctuary-locale";
import { SanctuaryIdentityControl } from "./sanctuary-identity-control";

export interface EmpireNavigationProps {
  readonly locale: SanctuaryLocale;
  readonly activeNavTab: NavigationSectionId;
  readonly sanctuaryRadianceActive: boolean;
  readonly quietMode: boolean;
  readonly mobileMenuOpen: boolean;
  readonly onNavigateToSection: (sectionId: NavigationSectionId) => void;
  readonly onOpenSearch: () => void;
  readonly onToggleRadiance: () => void;
  readonly onToggleLocale: () => void;
  readonly onToggleQuietMode: () => void;
  readonly onToggleMobileMenu: () => void;
  readonly onCloseMobileMenu: () => void;
}

export function EmpireNavigation({
  locale,
  activeNavTab,
  sanctuaryRadianceActive,
  quietMode,
  mobileMenuOpen,
  onNavigateToSection,
  onOpenSearch,
  onToggleRadiance,
  onToggleLocale,
  onToggleQuietMode,
  onToggleMobileMenu,
  onCloseMobileMenu,
}: EmpireNavigationProps) {
  return (
    <SiteNavigation
      navLabel="Primary Empire Navigation"
      mobileMenuOpen={mobileMenuOpen}
      brand={
        <a
          href="#the-gate"
          onClick={(event) => {
            event.preventDefault();
            onNavigateToSection("the-gate");
          }}
          className="home-header-brand group flex min-h-[44px] items-center gap-2.5 sm:gap-3"
        >
          <CrownEmblemIcon className="h-8 w-8 shrink-0 text-[var(--dna-accent)]" />
          <div className="flex flex-col leading-tight">
            <span className="home-brand-wordmark text-base sm:text-lg font-bold tracking-[0.06em] text-[var(--dna-text)]">
              A-L-L-A-H.COM
            </span>
            <span className="home-brand-tagline text-[11px] font-bold tracking-[0.12em] text-[var(--dna-accent)] uppercase">
              EMPIRE OF THE LIGHT
            </span>
          </div>
        </a>
      }
      items={[
        ...NAVIGATION_TABS.map((navTab) => ({
          id: navTab.id,
          label: navTab.label,
          href: `#${navTab.id}`,
          active: activeNavTab === navTab.id,
          onSelect: (event: MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
            onNavigateToSection(navTab.id);
          },
        })),
        {
          id: "moonwitness",
          label: "MOONWITNESS",
          href: "/moonwitness",
          active: false,
        },
      ]}
      actions={
        <>
          <Button
            type="button"
            variant="plain"
            onClick={onOpenSearch}
            aria-label="Search the Empire of the Light"
            title="Search (Ctrl+K)"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--dna-text)] hover:text-[var(--dna-accent)] transition-colors cursor-pointer"
          >
            <SearchLensIcon className="h-5 w-5" />
          </Button>

          <Button
            type="button"
            variant="plain"
            aria-pressed={sanctuaryRadianceActive}
            onClick={onToggleRadiance}
            aria-label="Toggle Sanctuary Radiance Mode"
            title="Toggle Sanctuary Radiance"
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors cursor-pointer ${
              sanctuaryRadianceActive
                ? "text-[var(--dna-accent)]"
                : "text-[var(--dna-text)] hover:text-[var(--dna-accent)]"
            }`}
          >
            <CrescentStarIcon className="h-5 w-5" />
          </Button>

          <SecondaryAction
            onClick={onToggleLocale}
            aria-label={locale === "en" ? "Switch to Indonesian" : "Switch to English"}
            title={locale === "en" ? "Ganti ke Bahasa Indonesia" : "Switch to English"}
            className="hidden sm:inline-flex font-mono text-xs"
          >
            {locale.toUpperCase()}
          </SecondaryAction>

          <div className="hidden xl:inline-flex">
            <SanctuaryIdentityControl />
          </div>

          <SecondaryAction
            aria-pressed={quietMode}
            onClick={onToggleQuietMode}
            aria-label="Toggle Quiet Contemplative Motion Mode"
            className="hidden xl:inline-flex font-mono text-xs"
          >
            {quietMode ? "QUIET" : "LIGHT"}
          </SecondaryAction>

          <PrimaryAction
            onClick={() => onNavigateToSection("the-dock")}
            className="hidden 2xl:inline-flex px-3.5 py-1.5 text-xs"
          >
            <span>{locale === "id" ? "GABUNG KRU" : "JOIN THE CREW"}</span>
            <span aria-hidden="true">&rarr;</span>
          </PrimaryAction>

          <CrownEmblemIcon
            className="hidden 2xl:block h-7 w-7 shrink-0 text-[var(--dna-accent)]"
            aria-hidden="true"
          />

          <SecondaryAction
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-sanctuary-nav"
            aria-label="Toggle Empire Navigation Menu"
            onClick={onToggleMobileMenu}
            className="flex min-w-[44px] px-3 lg:hidden"
          >
            <span className="font-mono text-sm">{mobileMenuOpen ? "✕" : "☰"}</span>
          </SecondaryAction>
        </>
      }
      mobileDrawer={
        <div
          id="mobile-sanctuary-nav"
          role="region"
          aria-label="Mobile Navigation"
          className="mx-4 mb-3 border-2 border-[var(--dna-accent)] bg-[var(--dna-canvas)] p-4 shadow-[4px_4px_0_var(--dna-accent-secondary)] lg:hidden"
        >
          <div className="grid grid-cols-2 gap-2">
            {NAVIGATION_TABS.map((navTab) => {
              const isTabActive = activeNavTab === navTab.id;
              return (
                <SecondaryAction
                  key={navTab.id}
                  data-active={isTabActive ? "true" : "false"}
                  onClick={() => onNavigateToSection(navTab.id)}
                  className="w-full justify-center"
                >
                  {navTab.label}
                </SecondaryAction>
              );
            })}
            <DnaButton
              asChild
              tone="secondary"
              className="mw-secondary-action inline-flex min-h-[44px] w-full items-center justify-center gap-2 px-4 py-2 text-sm font-medium uppercase"
            >
              <Link href="/moonwitness" onClick={onCloseMobileMenu}>
                MOONWITNESS
              </Link>
            </DnaButton>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--dna-accent)]/25 pt-3">
            <SecondaryAction
              aria-pressed={quietMode}
              onClick={onToggleQuietMode}
              className="flex-1"
            >
              {quietMode ? "RESTORE MOTION" : "QUIET MODE"}
            </SecondaryAction>
            <SecondaryAction onClick={onToggleLocale}>{locale.toUpperCase()}</SecondaryAction>
            <SanctuaryIdentityControl compact />
          </div>
        </div>
      }
    />
  );
}
