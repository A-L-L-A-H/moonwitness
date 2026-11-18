import Link from "next/link";
import { Button } from "@moonwitness/ui";
import { SanctuaryGateLink } from "@/components/sanctuary-gate-link";
import type { NavLink } from "./links";

export interface MobileMenuProps {
  links: NavLink[];
  active: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function MobileMenu({ links, active, onSelect, onClose }: MobileMenuProps) {
  return (
    <nav
      className="border-t border-[var(--border)] bg-[var(--ink)] px-4 py-3 lg:hidden"
      aria-label="Mobile"
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          onClick={() => {
            onSelect(link.id);
            onClose();
          }}
          aria-current={active === link.id ? "true" : undefined}
          className={`flex min-h-11 items-center px-2 py-2.5 font-brush text-lg ${active === link.id ? "text-[var(--pink)]" : "text-[var(--foreground)]"}`}
        >
          {link.label}
        </a>
      ))}
      <SanctuaryGateLink
        onClick={onClose}
        className="flex min-h-11 items-center px-2 py-2.5 font-brush text-lg text-[var(--yellow)]"
      >
        A-L-L-A-H
      </SanctuaryGateLink>
      <Link href="/shadow" onClick={onClose} className="mt-2 inline-block">
        <Button className="px-5 py-2.5 text-base">JOIN THE CREW →</Button>
      </Link>
    </nav>
  );
}
