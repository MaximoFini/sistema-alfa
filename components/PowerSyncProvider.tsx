"use client";

import { PowerSyncContext } from "@powersync/react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getPowerSyncDatabase, SupabaseConnector } from "@/lib/powersync";

export function PowerSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [db] = useState(() => getPowerSyncDatabase());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const connector = new SupabaseConnector(supabase);
    db.connect(connector).then(() => setInitialized(true));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        db.connect(connector);
      }
      if (event === "SIGNED_OUT") {
        db.disconnectAndClear();
        setInitialized(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [db]);

  return (
    <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
  );
}
