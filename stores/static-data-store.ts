import { useQuery } from "@powersync/react";

export interface AcceptedCard {
  id: string;
  name: string;
  is_active: boolean;
}

export function useStaticDataStore() {
  const { data: subscriptionPlans, isLoading: isLoadingPlans } = useQuery<{
    name: string;
    duration_days: number;
    price: number;
  }>("SELECT name, duration_days, price FROM subscription_plans WHERE is_active = 1 ORDER BY name");

  const { data: paymentMethods, isLoading: isLoadingMethods } = useQuery<{
    name: string;
  }>("SELECT name FROM payment_methods WHERE is_active = 1 ORDER BY name");

  const { data: acceptedCards, isLoading: acceptedCardsLoading } = useQuery<AcceptedCard>(
    "SELECT id, name, is_active FROM accepted_cards WHERE is_active = 1 ORDER BY name"
  );

  return {
    subscriptionPlans: subscriptionPlans ?? [],
    paymentMethods: paymentMethods ?? [],
    acceptedCards: (acceptedCards ?? []) as AcceptedCard[],
    isLoadingPlans,
    isLoadingMethods,
    acceptedCardsLoading,
  };
}
