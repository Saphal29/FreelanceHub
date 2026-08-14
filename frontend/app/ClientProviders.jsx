"use client";

import { useEffect, useState } from "react";
import { AuthProvider } from '@/contexts/AuthContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { ClientOnlyCallManager } from '@/components/calls/ClientOnlyCallManager'
import CookieConsent from '@/components/layout/CookieConsent'
import { TourProvider } from '@/components/tour/TourContext'
import TourOverlay from '@/components/tour/TourOverlay'

export function ClientProviders({ children }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <TourProvider>
          <ClientOnlyCallManager>
            {children}
            <CookieConsent />
          </ClientOnlyCallManager>
          <TourOverlay />
        </TourProvider>
      </SocketProvider>
    </AuthProvider>
  );
}