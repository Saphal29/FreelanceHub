"use client";

import { useEffect, useState } from "react";
import { CallNotificationManager } from "./CallNotificationManager";

export function ClientOnlyCallManager({ children }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{children}</>;
  }

  return (
    <CallNotificationManager>
      {children}
    </CallNotificationManager>
  );
}