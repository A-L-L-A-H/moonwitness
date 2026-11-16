"use client";

import { useEffect, useMemo, useState } from "react";
import type { NavItem } from "./nav-items";

/** Mengamati anchor section (item target.kind === "section" milik halaman ini)
 *  dan mengembalikan id item yang sedang terlihat di viewport. */
export function useActiveSection(items: NavItem[], pathname: string): string | null {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sectionAnchors = useMemo(
    () =>
      items
        .filter((i) => i.target.kind === "section" && i.target.href === pathname)
        .map((i) => ({ id: i.id, anchor: (i.target as { anchor: string }).anchor })),
    [items, pathname],
  );

  useEffect(() => {
    if (sectionAnchors.length === 0) {
      setActiveSection(null);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const hit = sectionAnchors.find((i) => i.anchor === entry.target.id);
          if (hit) setActiveSection(hit.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const item of sectionAnchors) {
      const el = document.getElementById(item.anchor);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sectionAnchors]);

  return activeSection;
}
