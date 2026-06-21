import { useQuery, usePowerSync } from "@powersync/react";

export interface SystemSettings {
  id: string;
  notify_days_before_expiration: number;
  alert_1_days_no_attendance: number;
  alert_2_days_no_attendance: number;
  alert_3_days_no_attendance: number;
  days_after_expiration_inactive: number;
  days_without_renewal_lost: number;
}

export function useSystemSettingsStore() {
  const db = usePowerSync();
  const { data: rawSettings, isLoading: settingsLoading } = useQuery<SystemSettings>(
    "SELECT id, notify_days_before_expiration, alert_1_days_no_attendance, alert_2_days_no_attendance, alert_3_days_no_attendance, days_after_expiration_inactive, days_without_renewal_lost FROM system_settings LIMIT 1"
  );

  const settings = rawSettings?.[0] ?? null;

  const updateSettings = async (updates: Partial<SystemSettings>) => {
    if (!settings) return;
    const setClauses: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(updates)) {
      if (key === "id") continue;
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
    if (setClauses.length === 0) return;
    values.push(settings.id);
    await db.execute(
      `UPDATE system_settings SET ${setClauses.join(", ")} WHERE id = ?`,
      values
    );
  };

  return {
    settings,
    settingsLoading,
    fetchSettings: async () => {},
    updateSettings,
    invalidateSettings: () => {},
  };
}
