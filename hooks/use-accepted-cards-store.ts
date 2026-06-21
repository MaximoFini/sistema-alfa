import { useQuery, usePowerSync } from "@powersync/react";

export interface AcceptedCard {
  id: string;
  name: string;
  is_active: boolean;
}

export function useAcceptedCardsStore() {
  const db = usePowerSync();
  const { data: rawCards, isLoading: cardsLoading } = useQuery<{
    id: string;
    name: string;
    is_active: number;
  }>("SELECT id, name, is_active FROM accepted_cards ORDER BY name");

  const cards: AcceptedCard[] = (rawCards ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    is_active: !!c.is_active,
  }));

  const toggleCard = async (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    await db.execute("UPDATE accepted_cards SET is_active = ? WHERE id = ?", [
      card.is_active ? 0 : 1,
      cardId,
    ]);
  };

  const updateCard = async (cardId: string, name: string) => {
    await db.execute("UPDATE accepted_cards SET name = ? WHERE id = ?", [name, cardId]);
  };

  const addCard = async (name: string) => {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO accepted_cards (id, name, is_active) VALUES (?, ?, 1)",
      [id, name]
    );
  };

  const deleteCard = async (cardId: string) => {
    await db.execute("DELETE FROM accepted_cards WHERE id = ?", [cardId]);
  };

  return {
    cards,
    cardsLoading,
    fetchCards: async () => {},
    toggleCard,
    updateCard,
    addCard,
    deleteCard,
    invalidateCards: () => {},
  };
}
