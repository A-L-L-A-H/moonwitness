"use client";

import { ZineCard } from "../primitives/zine-card";
import { ZineImage } from "../primitives/zine-image";
import { useSkin } from "../skin";

export interface CollectionItem {
  id: string;
  name: string;
  cover: string;
  episodes: number;
}

export interface CollectionsGridProps<T extends CollectionItem = CollectionItem> {
  collections: T[];
  onOpenCollection: (id: string) => void;
}

export function CollectionsGrid<T extends CollectionItem>({
  collections,
  onOpenCollection,
}: CollectionsGridProps<T>) {
  const { skin } = useSkin();
  return (
    <div className="@container" data-skin={skin}>
      <div className="grid grid-cols-2 gap-4 @[30rem]:grid-cols-4">
        {collections.map((collection) => (
          <button
            key={collection.id}
            type="button"
            onClick={() => onOpenCollection(collection.id)}
            className="text-left"
          >
            <ZineCard className="group overflow-hidden transition-transform hover:-translate-y-1">
              <span className="relative block h-28 overflow-hidden">
                <ZineImage
                  art={collection.cover}
                  alt=""
                  sizes="(max-width: 1279px) 50vw, 25vw"
                  className="grayscale transition-all duration-500 group-hover:grayscale-0"
                />
              </span>
              <span className="block p-3">
                <span className="block font-brush text-sm leading-tight text-[var(--foreground)] group-hover:text-[var(--primary)]">
                  {collection.name}
                </span>
                <span className="mt-1 block text-[11px] tracking-widest text-[var(--muted-foreground)]">
                  {collection.episodes} EPISODES
                </span>
              </span>
            </ZineCard>
          </button>
        ))}
      </div>
    </div>
  );
}
