"use client";

import { PowerSyncContext } from "@powersync/react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getPowerSyncDatabase, SupabaseConnector } from "@/lib/powersync";

// Module-level singleton connector to survive React StrictMode remounts
let sharedConnector: SupabaseConnector | null = null;
let connectionInitiated = false;

export function PowerSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [db] = useState(() => getPowerSyncDatabase());
  const cleanedUp = useRef(false);

  useEffect(() => {
    cleanedUp.current = false;

    function connectPowerSync() {
      if (connectionInitiated || cleanedUp.current) return;
      sharedConnector = new SupabaseConnector(supabase);
      connectionInitiated = true;
      db.connect(sharedConnector)
        .then(() => {
          if (!cleanedUp.current) {
            console.log("PowerSync connected successfully");
          }
        })
        .catch((error) => {
          console.error("PowerSync connect error:", error);
          connectionInitiated = false;
          sharedConnector = null;
        });
    }

    // Wait for a valid session before connecting — avoids fetchCredentials()
    // throwing "No active session" on first call when localStorage hasn't loaded yet.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cleanedUp.current) return;
      if (session) connectPowerSync();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (cleanedUp.current) return;

      if (event === "SIGNED_OUT") {
        connectionInitiated = false;
        sharedConnector = null;
        db.disconnectAndClear();
      }
      // TOKEN_REFRESHED does not require a reconnect — PowerSync's connector
      // calls fetchCredentials() on demand and gets the fresh token automatically.
      // SIGNED_IN after a SIGNED_OUT does require reconnecting.
      if (event === "SIGNED_IN") {
        connectPowerSync();
      }
    });

    return () => {
      cleanedUp.current = true;
      subscription.unsubscribe();
      // Do NOT disconnect the db here — StrictMode unmount/remount would kill
      // the connection. The singleton pattern keeps it alive.
    };
  }, [db]);

  return (
    <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
  );
}
