"use client";

import { useEffect, useState, useRef } from "react";
import { useTour } from "./TourContext";

const TOOLTIP_W = 320;
const TOOLTIP_H = 180; // rough estimate — real height varies

function computePosition(rect, placement, vpW, vpH) {
  if (!rect) {
    // Centre-screen fallback
    return {
      top: Math.max(16, vpH / 2 - TOOLTIP_H / 2),
      left: Math.max(16, vpW / 2 - TOOLTIP_W / 2),
    };
  }

  const gap = 14;
  let top, left;

  switch (placement) {
    case "bottom":
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      break;
    case "top":
      top = rect.top - TOOLTIP_H - gap;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      break;
    case "left":
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2;
      left = rect.left - TOOLTIP_W - gap;
      break;
    case "right":
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2;
      left = rect.right + gap;
      break;
    default:
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
  }

  // Clamp to viewport
  top = Math.max(16, Math.min(top, vpH - TOOLTIP_H - 16));
  left = Math.max(16, Math.min(left, vpW - TOOLTIP_W - 16));

  return { top, left };
}

export default function TourTooltip() {
  const { isActive, currentStep, steps, next, prev, skip } = useTour();
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  const step = steps[currentStep];

  useEffect(() => {
    if (!isActive || !step) return;

    const update = () => {
      const vpW = window.innerWidth;
      const vpH = window.innerHeight;
      const el = step.target ? document.querySelector(step.target) : null;
      const rect = el ? el.getBoundingClientRect() : null;
      setPos(computePosition(rect, step.placement, vpW, vpH));
    };

    // Try immediately, then retry a couple of times to catch late renders
    update();
    const t1 = setTimeout(update, 150);
    const t2 = setTimeout(update, 400);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isActive, currentStep, step]);

  // Trap focus inside tooltip
  useEffect(() => {
    if (isActive && tooltipRef.current) {
      tooltipRef.current.focus();
    }
  }, [isActive, currentStep]);

  if (!isActive || !step) return null;

  const isLast = currentStep === steps.length - 1;

  return (
    <div
      ref={tooltipRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Walkthrough step ${currentStep + 1} of ${steps.length}: ${step.title}`}
      tabIndex={-1}
      className="fixed z-[9999] outline-none"
      style={{ top: pos.top, left: pos.left, width: TOOLTIP_W }}
      onKeyDown={(e) => {
        if (e.key === "Escape") skip();
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
      }}
    >
      <div className="bg-[var(--paper)] border-2 border-[var(--ink)] shadow-xl font-mono-ledger text-[var(--ink)]">
        {/* Header bar */}
        <div className="bg-[var(--ink)] text-[var(--paper)] px-4 py-2 flex items-center justify-between text-[10px] uppercase tracking-wider">
          <span className="font-bold">
            STEP {String(currentStep + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </span>
          <button
            onClick={skip}
            className="text-[var(--paper)]/60 hover:text-[var(--paper)] transition-colors text-[10px] underline"
            aria-label="Skip tour"
          >
            Skip tour
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2">
          <p className="font-bold text-[13px] text-[var(--ink)] leading-snug">{step.title}</p>
          <p className="text-[12px] text-[var(--muted)] leading-relaxed">{step.body}</p>
        </div>

        {/* Footer nav */}
        <div className="border-t border-[var(--line)] px-4 py-3 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={currentStep === 0}
            className="text-[11px] font-bold text-[var(--muted)] hover:text-[var(--ink)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          {/* Step dots */}
          <div className="flex items-center space-x-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`inline-block rounded-full transition-all ${
                  i === currentStep
                    ? "w-2 h-2 bg-[var(--signal)]"
                    : i < currentStep
                    ? "w-1.5 h-1.5 bg-[var(--ink)]"
                    : "w-1.5 h-1.5 bg-[var(--line)]"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="text-[11px] font-bold bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] px-3 py-1.5 transition-colors"
          >
            {isLast ? "Done ✓" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
