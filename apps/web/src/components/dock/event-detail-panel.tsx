"use client";

import type { Era, TimelineEvent } from "@moonwitness/types";
import { EventDetail } from "@moonwitness/ui";
import { Sheet, SheetContent } from "@moonwitness/ui";

interface EventDetailPanelProps {
  variant: "aside" | "drawer";
  event: TimelineEvent;
  era: Era;
  relatedEvents: TimelineEvent[];
  shareUrl: string;
  onRelated: (id: string) => void;
  onClose?: () => void;
}

export function EventDetailPanel({
  variant,
  event,
  era,
  relatedEvents,
  shareUrl,
  onRelated,
  onClose,
}: EventDetailPanelProps) {
  const detail = (
    <EventDetail
      event={event}
      era={era}
      relatedEvents={relatedEvents}
      shareUrl={shareUrl}
      onRelated={onRelated}
      onClose={onClose}
    />
  );

  if (variant === "aside") {
    return (
      <aside className="hidden xl:block" aria-label="Event detail">
        <div className="sticky top-20 h-[calc(100vh-6rem)]">{detail}</div>
      </aside>
    );
  }

  // Drawer variant (mobile) - use Sheet from shadcn/Radix
  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full max-w-md xl:hidden"
      >
        {detail}
      </SheetContent>
    </Sheet>
  );
}
