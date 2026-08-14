"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTour } from "./TourContext";
import TourTooltip from "./TourTooltip";

function SpotlightRect({ target }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    const update = () => {
      if (!target) { setRect(null); return; }
      const el = document.querySelector(target);
      if (!el) { setRect(null); return; }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setRect(el.getBoundingClientRect());
    };
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
  }, [target]);

  return rect;
}

export default function TourOverlay() {
  const { isActive, steps, currentStep, skip } = useTour();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !isActive) return null;

  const step = steps[currentStep];
  const target = step?.target ?? null;

  // Build the spotlight via box-shadow cut-out
  const SpotlightComponent = () => {
    const [rect, setRect] = useState(null);

    useEffect(() => {
      const update = () => {
        if (!target) { setRect(null); return; }
        const el = document.querySelector(target);
        if (!el) { setRect(null); return; }
        setRect(el.getBoundingClientRect());
      };
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
    }, []);

    const pad = 6;

    if (!rect) {
      // No target — full dim backdrop, no hole
      return (
        <div
          className="fixed inset-0 bg-black/50 z-[9990]"
          onClick={skip}
          aria-hidden="true"
        />
      );
    }

    const { top, left, width, height } = rect;
    // Use a massive box-shadow to create the dim backdrop with a transparent hole
    const shadowSpread = 9999;
    const shadowStyle = {
      position: "fixed",
      top: top - pad,
      left: left - pad,
      width: width + pad * 2,
      height: height + pad * 2,
      boxShadow: `0 0 0 ${shadowSpread}px rgba(0,0,0,0.55)`,
      borderRadius: 2,
      pointerEvents: "none",
      zIndex: 9990,
    };

    return (
      <>
        {/* Clickable backdrop around the spotlight */}
        <div
          className="fixed inset-0 z-[9989]"
          onClick={skip}
          aria-hidden="true"
        />
        {/* The spotlight cutout */}
        <div style={shadowStyle} aria-hidden="true" />
        {/* Thin red border around the highlighted element */}
        <div
          style={{
            position: "fixed",
            top: top - pad,
            left: left - pad,
            width: width + pad * 2,
            height: height + pad * 2,
            border: "2px solid var(--signal)",
            borderRadius: 2,
            pointerEvents: "none",
            zIndex: 9991,
          }}
          aria-hidden="true"
        />
      </>
    );
  };

  return createPortal(
    <>
      <SpotlightComponent />
      <TourTooltip />
    </>,
    document.body
  );
}
