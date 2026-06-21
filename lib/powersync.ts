import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  CrudTransaction,
  PowerSyncBackendConnector,
  PowerSyncDatabase,
  WASQLiteOpenFactory,
} from "@powersync/web";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppSchema } from "./powersync-schema";

export class SupabaseConnector implements PowerSyncBackendConnector {
  constructor(private supabase: SupabaseClient) {}

  async fetchCredentials() {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    if (!session) {
      throw new Error("No active session");
    }

    return {
      endpoint: process.env.NEXT_PUBLIC_POWERSYNC_URL!,
      token: session.access_token,
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : undefined,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    let tx: CrudTransaction | null;
    while ((tx = await database.getNextCrudTransaction())) {
      try {
        for (const op of tx.crud) {
          await this.applyOperation(op);
        }
        await tx.complete();
      } catch (error) {
        console.error("PowerSync upload error:", error);
        throw error;
      }
    }
  }

  private async applyOperation(op: CrudEntry) {
    const table = op.table;
    const id = op.id;

    switch (op.op) {
      case "PUT":
        await this.supabase.from(table).upsert({ id, ...op.opData });
        break;
      case "PATCH":
        await this.supabase.from(table).update(op.opData!).eq("id", id);
        break;
      case "DELETE":
        await this.supabase.from(table).delete().eq("id", id);
        break;
    }
  }
}

let powerSyncInstance: PowerSyncDatabase | null = null;

export function getPowerSyncDatabase(): PowerSyncDatabase {
  if (!powerSyncInstance) {
    const factory = new WASQLiteOpenFactory({
      dbFilename: "sistema-alfa.db",
      worker: "/@powersync/worker/WASQLiteDB.umd.js",
    });

    powerSyncInstance = new PowerSyncDatabase({
      schema: AppSchema,
      database: factory,
      sync: {
        worker: "/@powersync/worker/SharedSyncImplementation.umd.js",
      },
    });
  }
  return powerSyncInstance;
}
