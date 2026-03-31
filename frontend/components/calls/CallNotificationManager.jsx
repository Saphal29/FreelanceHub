"use client";

import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { useRouter } from "next/navigation";
import { connectVideoSocket } from "@/lib/videoSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useAuth } from "@/contexts/AuthContext";

// ─── Context ─────────────────────────────────────────────────────────────────

const CallNotificationsContext = createContext(null);

// ─── useCallNotifications hook ────────────────────────────────────────────────

export function useCallNotifications() {
  const ctx = useContext(CallNotificationsContext);
  if (!ctx) {
    throw new Error("useCallNotifications must be used within CallNotificationManager");
  }
  return ctx;
}

// ─── Ringing animation ───────────────────────────────────────────────────────

function RingAnimation() {
  return (
    <span className="relative flex h-16 w-16">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
      <span className="relative inline-flex rounded-full h-16 w-16 bg-amber-500 items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-black"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      </span>
    </span>
  );
}

// ─── Incoming call modal ──────────────────────────────────────────────────────

function IncomingCallModal({ call, onAccept, onDecline }) {
  const { callerName, callType } = call;
  const initial = callerName ? callerName.charAt(0).toUpperCase() : "?";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modern-xl p-8 flex flex-col items-center gap-6 w-80 max-w-full mx-4">
        {/* Avatar */}
        <div className="h-20 w-20 rounded-full bg-black flex items-center justify-center text-white text-3xl font-bold select-none">
          {initial}
        </div>

        {/* Caller info */}
        <div className="text-center">
          <p className="text-black font-bold text-xl">{callerName || "Unknown"}</p>
          <p className="text-gray-500 text-sm mt-1">
            {callType === "video" ? "📹 Video Call" : "🎙️ Audio Call"}
          </p>
        </div>

        {/* Ringing animation */}
        <RingAnimation />

        {/* Action buttons */}
        <div className="flex gap-4 w-full">
          <button
            onClick={onDecline}
            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors duration-200"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors duration-200"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Missed call toast ────────────────────────────────────────────────────────

function MissedCallToast({ callerName, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-2xl shadow-modern-lg flex items-center gap-3 animate-slide-up">
      <span className="text-amber-400 text-lg">📵</span>
      <span className="text-sm font-medium">Missed call from {callerName || "Unknown"}</span>
      <button
        onClick={onDismiss}
        className="ml-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

// ─── CallNotificationManager component ───────────────────────────────────────

export function CallNotificationManager({ children }) {
  const router = useRouter();
  const { user } = useAuth();
  const { acceptCall, rejectCall } = useWebRTC();

  const [incomingCall, setIncomingCall] = useState(null);
  const [missedCalls, setMissedCalls] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);
  const socketRef = useRef(null);

  // Set mounted state
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Request push notification permission on mount
  useEffect(() => {
    if (!hasMounted) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [hasMounted]);

  // Connect to video socket and listen for call events — only when authenticated
  useEffect(() => {
    if (!hasMounted) return;
    if (!user) return; // don't connect until logged in

    const socket = connectVideoSocket();
    socketRef.current = socket;
    if (!socket) return;

    const onCallIncoming = ({ callId, callerId, callerName, callType }) => {
      setIncomingCall({ callId, callerId, callerName, callType });

      // Browser push notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Incoming ${callType === "video" ? "Video" : "Audio"} Call`, {
          body: `${callerName || "Someone"} is calling you`,
          icon: "/favicon.ico",
        });
      }
    };

    const onCallCancelled = ({ callId }) => {
      setIncomingCall((prev) => {
        if (prev && prev.callId === callId) {
          // Show missed call toast
          setMissedCalls((m) => [...m, { id: callId, callerName: prev.callerName }]);
          return null;
        }
        return prev;
      });
    };

    socket.on("call:incoming", onCallIncoming);
    socket.on("call:cancelled", onCallCancelled);

    return () => {
      socket.off("call:incoming", onCallIncoming);
      socket.off("call:cancelled", onCallCancelled);
    };
  }, [user, hasMounted]);

  const handleAccept = useCallback(async () => {
    if (!incomingCall) return;
    const { callId } = incomingCall;
    setIncomingCall(null);
    await acceptCall(callId);
    router.push(`/calls/${callId}`);
  }, [incomingCall, acceptCall, router]);

  const handleDecline = useCallback(() => {
    if (!incomingCall) return;
    rejectCall(incomingCall.callId);
    setIncomingCall(null);
  }, [incomingCall, rejectCall]);

  const dismissMissedCall = useCallback((id) => {
    setMissedCalls((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const contextValue = {
    incomingCall,
    acceptCall: handleAccept,
    rejectCall: handleDecline,
  };

  return (
    <CallNotificationsContext.Provider value={contextValue}>
      {children}

      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}

      {missedCalls.map((mc) => (
        <MissedCallToast
          key={mc.id}
          callerName={mc.callerName}
          onDismiss={() => dismissMissedCall(mc.id)}
        />
      ))}
    </CallNotificationsContext.Provider>
  );
}

export default CallNotificationManager;
