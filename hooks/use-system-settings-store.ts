import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { CACHE_DURATION } from "./store-constants";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SystemSettings {
  id: string;
  notify_days_before_expiration: number;
  alert_1_days_no_attendance: number;
  alert_2_days_no_attendance: number;
  alert_3_days_no_attendance: number;
  days_after_expiration_inactive: number;
  days_without_renewal_lost: number;
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface SystemSettingsState {
  settings: SystemSettings | null;
  settingsLoading: boolean;
  settingsLastFetched: number | null;

  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  invalidateSettings: () => void;
}

export const useSystemSettingsStore = create<SystemSettingsState>((set, get) => ({
  settings: null,
  settingsLoading: false,
  settingsLastFetched: null,

  fetchSettings: async () => {
    const state = get();
    const now = Date.now();

    if (state.settingsLastFetched && now - state.settingsLastFetched < CACHE_DURATION) {
      return;
    }
    if (state.settingsLoading) return;

    set({ settingsLoading: true });

    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select(
          "id, notify_days_before_expiration, alert_1_days_no_attendance, alert_2_days_no_attendance, alert_3_days_no_attendance, days_after_expiration_inactive, days_without_renewal_lost"
        )
        .limit(1)
        .single();

      if (error) throw error;

      set({ settings: data, settingsLastFetched: Date.now(), settingsLoading: false });
    } catch (error) {
      console.error("Error fetching settings:", error);
      set({ settingsLoading: false });
    }
  },

  updateSettings: async (updates) => {
    const state = get();
    if (!state.settings) return;

    try {
      const { error } = await supabase
        .from("system_settings")
        .update(updates)
        .eq("id", state.settings.id);

      if (error) throw error;

      set({ settings: { ...state.settings, ...updates } });
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  },

  invalidateSettings: () => set({ settingsLastFetched: null }),
}));
