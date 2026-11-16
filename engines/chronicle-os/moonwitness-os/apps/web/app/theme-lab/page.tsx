'use client'

import React from 'react'
import { useRiotTheme, ThemePreset, ChaosIntensity, ThemeMode, Density } from '@repo/theme'
import { PageHeader, MetricCard, Panel, StatusBadge, Button } from '@repo/ui'

export default function ThemeLabPage() {
  const { preset, setPreset, chaos, setChaos, mode, setMode, density, setDensity } = useRiotTheme()

  const presets: ThemePreset[] = ['overdrive', 'xerox', 'acid-pop', 'industrial']
  const chaosLevels: ChaosIntensity[] = ['calm', 'balanced', 'loud', 'extreme']
  const modes: ThemeMode[] = ['dark', 'light', 'system']
  const densities: Density[] = ['compact', 'comfortable', 'spacious']

  return (
    <div className="min-h-screen bg-[var(--riot-bg,#11110F)] p-8 text-[var(--riot-fg,#FFFDF6)] transition-colors duration-200">
      <PageHeader
        title="R!OT // THEME LAB"
        tag="DEV-OPS"
        badge="ACTIVE LAB"
        subtitle="Live testing suite for presets, chaos levels, density and UI primitives."
      />

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <Panel title="Preset Selector" code="PR-01">
          <div className="flex flex-col gap-2">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`border p-2 font-mono text-xs font-bold uppercase transition-all ${
                  preset === p
                    ? 'border-black bg-[var(--riot-primary,#D7FF00)] text-black shadow-[2px_2px_0px_#000]'
                    : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Chaos Intensity" code="CH-02">
          <div className="flex flex-col gap-2">
            {chaosLevels.map((c) => (
              <button
                key={c}
                onClick={() => setChaos(c)}
                className={`border p-2 font-mono text-xs font-bold uppercase transition-all ${
                  chaos === c
                    ? 'border-black bg-[var(--riot-secondary,#FF3EA5)] text-white shadow-[2px_2px_0px_#000]'
                    : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Mode" code="MD-03">
          <div className="flex flex-col gap-2">
            {modes.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`border p-2 font-mono text-xs font-bold uppercase transition-all ${
                  mode === m
                    ? 'border-black bg-white text-black shadow-[2px_2px_0px_#000]'
                    : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Density" code="DN-04">
          <div className="flex flex-col gap-2">
            {densities.map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`border p-2 font-mono text-xs font-bold uppercase transition-all ${
                  density === d
                    ? 'border-black bg-cyan-400 text-black shadow-[2px_2px_0px_#000]'
                    : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <MetricCard label="CPU Load" value="42.8%" change="4.1%" positive={true} code="ENG-01" />
        <MetricCard label="Active Nodes" value="1,048" change="12" positive={true} code="NET-09" />
        <MetricCard label="Dropped Packets" value="0.003%" change="0.001%" positive={false} code="SIG-44" />
        <MetricCard label="Throughput" value="18.4 Gb/s" change="1.2 Gb/s" positive={true} code="LNK-77" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel title="Status Primitives" code="UI-STAT">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status="ONLINE" />
            <StatusBadge status="OFFLINE" />
            <StatusBadge status="CRITICAL" />
            <StatusBadge status="STANDBY" />
            <StatusBadge status="SYNC" />
          </div>
        </Panel>

        <Panel title="Interactive Actions" code="UI-ACT">
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}

