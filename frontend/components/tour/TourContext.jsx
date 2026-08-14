"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { CLIENT_STEPS, FREELANCER_STEPS } from "./tourSteps";

const TourContext = createContext(null);

export function TourProvider({ children }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [role, setRole] = useState(null);
  const waitTimerRef = useRef(null);

  const steps = role === "CLIENT" ? CLIENT_STEPS : FREELANCER_STEPS;

  /** Attempt to scroll the target into view and return its rect */
  const getTargetRect = useCallback((selector) => {
    if (!selector) return null;
    const el = document.querySelector(selector);
    if (!el) return null;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    return el.getBoundingClientRect();
  }, []);

  /** Navigate to a route if not already there, then wait for target */
  const navigateAndWait = useCallback(
    (route, target, onReady) => {
      const isSamePage = window.location.pathname === route;
      if (!isSamePage) {
        router.push(route);
      }
      // Poll for the target element (max 3 s)
      let attempts = 0;
      const poll = () => {
        attempts++;
        const el = target ? document.querySelector(target) : null;
        if (el || attempts > 30) {
          onReady();
        } else {
          waitTimerRef.current = setTimeout(poll, 100);
        }
      };
      // Give the router a tick to start rendering
      waitTimerRef.current = setTimeout(poll, isSamePage ? 0 : 400);
    },
    [router]
  );

  const start = useCallback(
    (userRole) => {
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
      const r = userRole || role;
      setRole(r);
      setCurrentStep(0);
      setIsActive(true);
      const stepsForRole = r === "CLIENT" ? CLIENT_STEPS : FREELANCER_STEPS;
      navigateAndWait(stepsForRole[0].route, stepsForRole[0].target, () => {});
    },
    [role, navigateAndWait]
  );

  const goToStep = useCallback(
    (index) => {
      const step = steps[index];
      if (!step) return;
      setCurrentStep(index);
      navigateAndWait(step.route, step.target, () => {});
    },
    [steps, navigateAndWait]
  );

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      finish();
    }
  }, [currentStep, steps, goToStep]);

  const prev = useCallback(() => {
    if (currentStep > 0) goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const finish = useCallback(async () => {
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    setIsActive(false);
    try {
      await api.patch("/profile/tour-complete");
    } catch (_) {
      // non-critical — tour state is local even if the persist fails
    }
  }, []);

  const skip = finish;

  return (
    <TourContext.Provider
      value={{ isActive, currentStep, steps, role, start, next, prev, skip, finish, getTargetRect }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside TourProvider");
  return ctx;
}
