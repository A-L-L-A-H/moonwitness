"use client";

import Link from "next/link";
import { useState } from "react";
import {
  DHGS_13_STEPS,
  QUARANTINED_AMBIGUITY_LEDGER,
  SOVEREIGN_ENGINE_SPECS,
} from "@/data/empire-canon-codex";
import { MTimeInteractiveEngine } from "../mtime-observatory";

export function DhgsAndMTimeSimulator() {
  const [activeStepNum, setActiveStepNum] = useState<number>(1);
  const activeStep = DHGS_13_STEPS.find((s) => s.stepNumber === activeStepNum) ?? DHGS_13_STEPS[0]!;

  return (
    <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
        <span className="font-monument text-sm sm:text-base tracking-[0.16em] text-[#f5e3b8] uppercase">
          DHGS 13-STEP ASSURANCE LOOP &amp; MCLOCK-1 TEMPORAL INSPECTOR
        </span>
        <span className="font-mono text-[11px] text-[#d6b46c]">
          RECEIVE → ... → LEARN · {SOVEREIGN_ENGINE_SPECS.mTime.version}
        </span>
      </div>

      {/* DHGS 13-Step Stepper */}
      <div>
        <div className="flex flex-wrap gap-1.5">
          {DHGS_13_STEPS.map((step) => {
            const active = step.stepNumber === activeStep.stepNumber;
            return (
              <button
                key={step.code}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveStepNum(step.stepNumber)}
                className={`min-h-[44px] border px-2.5 py-1.5 font-mono text-[10px] cursor-pointer ${
                  active
                    ? "border-[#e6c987] bg-[#d6b46c]/20 text-[#fff6df]"
                    : "border-[#d6b46c]/20 bg-[#0b0e18] text-[#bfb59e] hover:border-[#d6b46c]/50"
                }`}
              >
                {String(step.stepNumber).padStart(2, "0")} {step.code}
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 border border-[#d6b46c]/20 bg-[#0a0d16] p-4 sm:grid-cols-3">
          <div>
            <div className="font-mono text-[10px] text-[#d6b46c]">ACTIVE GATE STEP</div>
            <div className="font-monument mt-1 text-base text-[#fff6df]">
              {String(activeStep.stepNumber).padStart(2, "0")} · {activeStep.code}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#d6b46c]">REQUIRED ACTION</div>
            <p className="mt-1 text-xs text-[#dfd5c0]">{activeStep.action}</p>
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#d6b46c]">INVARIANT PURPOSE</div>
            <p className="mt-1 text-xs text-[#f5dfa6]">{activeStep.purpose}</p>
          </div>
        </div>
      </div>

      {/* Live M-Time Explainable Observatory Engine (Antikythera Port) */}
      <div className="border-t border-[#d6b46c]/20 pt-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-mono text-[10.5px] tracking-[0.16em] text-[#dfc07b] uppercase">
            ANTIKYTHERA M-TIME · LIVE ASTRONOMICAL &amp; CRITERION ENGINE
          </div>
          <Link
            href="/mtime"
            className="btn-luxe-secondary inline-flex items-center px-3.5 py-1 font-mono text-[10px] text-[#f5dfa6] uppercase"
          >
            OPEN FULL M-TIME PAGE &rsaquo;
          </Link>
        </div>
        <MTimeInteractiveEngine compact />
      </div>
    </div>
  );
}

export function QuarantinedLedgerPanel() {
  return (
    <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
        <span className="font-monument text-sm sm:text-base tracking-[0.16em] text-[#f5e3b8] uppercase">
          QUARANTINED AMBIGUITY &amp; PROVENANCE LEDGER (§VII)
        </span>
        <span className="font-mono text-[11px] text-[#d6b46c]">
          ZERO SILENT FABRICATION · EXPLICIT UNKNOWN DISCLOSURE
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QUARANTINED_AMBIGUITY_LEDGER.map((item) => (
          <div key={item.id} className="border border-[#d6b46c]/25 bg-[#0a0d16] p-4">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-[#d6b46c]">{item.id.toUpperCase()}</span>
              <span className="border border-[#e6c987]/40 bg-[#101423] px-2 py-0.5 text-[#f5dfa6]">
                {item.classification}
              </span>
            </div>
            <h5 className="font-monument mt-1.5 text-xs sm:text-sm text-[#fff6df]">{item.title}</h5>
            <p className="mt-1 text-xs text-[#cfc5b0]">{item.detail}</p>
            <div className="mt-2 border-t border-[#d6b46c]/15 pt-2 font-mono text-[10.5px] text-[#f5dfa6]">
              RULE // {item.rule}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
