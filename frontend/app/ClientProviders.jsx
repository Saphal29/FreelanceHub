"use client";

import { useEffect, useState } from "react";
import { AuthProvider } from '@/contexts/AuthContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { ClientOnlyCallManager } from '@/components/calls/ClientOnlyCallManager'

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
        <ClientOnlyCallManager>
          {children}
        </ClientOnlyCallManager>
      </SocketProvider>
    </AuthProvider>
  );
}