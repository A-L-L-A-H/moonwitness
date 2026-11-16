import React from 'react'
import fs from 'fs'
import path from 'path'
import { PageHeader, Panel } from '@repo/ui'

export default function ArtworkGalleryPage() {
  const manifestPath = path.resolve(process.cwd(), '../../.riot-ai/11-ASSET-MANIFEST.json')
  let manifest = { entries: [], p5_sketches: [] }
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  } catch (err) {
    // fallback if running standalone
  }

  return (
    <div className="min-h-screen bg-[#11110F] p-8 font-mono text-[#FFFDF6]">
      <PageHeader
        title="R!OT // ARTWORK VAULT"
        tag="ASSETS"
        badge="68 ASSETS"
        subtitle="Catalogued vector, raster, and generative artwork deliverables."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Panel title="PNG RASTERS" code="24/24">
          <p className="text-sm text-neutral-400">High-res hero banners, texture plates, mascot poses.</p>
        </Panel>
        <Panel title="SVG VECTORS" code="32/32">
          <p className="text-sm text-neutral-400">Stickers, decals, framed borders, and vector spot illustrations.</p>
        </Panel>
        <Panel title="p5 SKETCHES" code="12/12">
          <p className="text-sm text-neutral-400">Deterministic generative seeds and procedural xerox canvas.</p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {manifest.entries.map((item: any) => (
          <div key={item.id} className="border-2 border-neutral-700 bg-[#1A1B18] p-4 shadow-[3px_3px_0px_#000]">
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span className="uppercase">{item.format}</span>
              <span className="text-emerald-400">● {item.status}</span>
            </div>
            <div className="my-2 truncate font-mono text-xs font-bold text-[#D7FF00]">{item.id}</div>
            <p className="line-clamp-2 text-[11px] text-neutral-400">{item.purpose}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

