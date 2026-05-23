import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { CACHE_DURATION } from "./store-constants";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AcceptedCard {
  id: string;
  name: string;
  is_active: boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface AcceptedCardsState {
  cards: AcceptedCard[];
  cardsLoading: boolean;
  cardsLastFetched: number | null;

  fetchCards: () => Promise<void>;
  toggleCard: (cardId: string) => Promise<void>;
  updateCard: (cardId: string, name: string) => Promise<void>;
  addCard: (name: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  invalidateCards: () => void;
}

export const useAcceptedCardsStore = create<AcceptedCardsState>((set, get) => ({
  cards: [],
  cardsLoading: false,
  cardsLastFetched: null,

  fetchCards: async () => {
    const state = get();
    const now = Date.now();

    if (state.cardsLastFetched && now - state.cardsLastFetched < CACHE_DURATION) {
      return;
    }
    if (state.cardsLoading) return;

    set({ cardsLoading: true });

    try {
      const { data, error } = await supabase
        .from("accepted_cards")
        .select("id, name, is_active")
        .order("name", { ascending: true });

      if (error) throw error;

      set({
        cards: (data || []).map((c: any) => ({ id: c.id, name: c.name, is_active: c.is_active })),
        cardsLastFetched: Date.now(),
        cardsLoading: false,
      });
    } catch (error) {
      console.error("Error fetching accepted cards:", error);
      set({ cardsLoading: false });
    }
  },

  toggleCard: async (cardId) => {
    const state = get();
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;

    try {
      const { error } = await supabase
        .from("accepted_cards")
        .update({ is_active: !card.is_active })
        .eq("id", cardId);

      if (error) throw error;

      set({ cards: state.cards.map((c) => c.id === cardId ? { ...c, is_active: !c.is_active } : c) });
    } catch (error) {
      console.error("Error toggling accepted card:", error);
    }
  },

  updateCard: async (cardId, name) => {
    try {
      const { error } = await supabase
        .from("accepted_cards")
        .update({ name })
        .eq("id", cardId);

      if (error) throw error;

      const state = get();
      set({ cards: state.cards.map((c) => c.id === cardId ? { ...c, name } : c) });
    } catch (error) {
      console.error("Error updating accepted card:", error);
    }
  },

  addCard: async (name) => {
    try {
      const { data, error } = await supabase
        .from("accepted_cards")
        .insert({ name, is_active: true })
        .select()
        .single();

      if (error) throw error;

      const state = get();
      set({ cards: [...state.cards, { id: data.id, name: data.name, is_active: data.is_active }] });
    } catch (error) {
      console.error("Error adding accepted card:", error);
    }
  },

  deleteCard: async (cardId) => {
    try {
      const { error } = await supabase
        .from("accepted_cards")
        .delete()
        .eq("id", cardId);

      if (error) throw error;

      const state = get();
      set({ cards: state.cards.filter((c) => c.id !== cardId) });
    } catch (error) {
      console.error("Error deleting accepted card:", error);
    }
  },

  invalidateCards: () => set({ cardsLastFetched: null }),
}));
