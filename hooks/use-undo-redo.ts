"use client";

import { useState, useCallback, useRef } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(initialState: T, maxHistory: number = 50) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Para evitar agregar al historial en el primer render o cuando se carga desde localStorage
  const isInitialMount = useRef(true);
  const skipNextHistory = useRef(false);

  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      setHistory((currentHistory) => {
        const actualNewState =
          typeof newState === "function"
            ? (newState as (prev: T) => T)(currentHistory.present)
            : newState;

        // Evitar agregar al historial si es el estado inicial o si se debe saltar
        if (skipNextHistory.current) {
          skipNextHistory.current = false;
          return {
            past: currentHistory.past,
            present: actualNewState,
            future: currentHistory.future,
          };
        }

        // No agregar al historial si el estado no cambió
        if (
          JSON.stringify(actualNewState) ===
          JSON.stringify(currentHistory.present)
        ) {
          return currentHistory;
        }

        // Agregar estado actual al pasado y limpiar el futuro
        const newPast = [...currentHistory.past, currentHistory.present];

        // Mantener solo los últimos maxHistory estados
        const trimmedPast =
          newPast.length > maxHistory
            ? newPast.slice(newPast.length - maxHistory)
            : newPast;

        return {
          past: trimmedPast,
          present: actualNewState,
          future: [], // Limpiar el futuro cuando se hace un cambio nuevo
        };
      });
    },
    [maxHistory],
  );

  const undo = useCallback(() => {
    setHistory((currentHistory) => {
      if (currentHistory.past.length === 0) {
        return currentHistory;
      }

      const previous = currentHistory.past[currentHistory.past.length - 1];
      const newPast = currentHistory.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [currentHistory.present, ...currentHistory.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((currentHistory) => {
      if (currentHistory.future.length === 0) {
        return currentHistory;
      }

      const next = currentHistory.future[0];
      const newFuture = currentHistory.future.slice(1);

      return {
        past: [...currentHistory.past, currentHistory.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newState: T) => {
    skipNextHistory.current = true;
    setHistory({
      past: [],
      present: newState,
      future: [],
    });
  }, []);

  const setWithoutHistory = useCallback(
    (newState: T | ((prev: T) => T)) => {
      skipNextHistory.current = true;
      setState(newState);
    },
    [setState],
  );

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state: history.present,
    setState,
    setWithoutHistory,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  };
}
