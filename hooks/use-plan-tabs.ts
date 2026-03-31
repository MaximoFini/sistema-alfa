"use client";

import { useState, useEffect, useCallback } from "react";
import { PlanExercise, Day } from "@/lib/types/plans";

export interface PlanTab {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  days: Day[];
  exercises: PlanExercise[];
  isTemplate: boolean;
  createdAt: number;
}

const MAX_TABS = 5;
const STORAGE_KEY = "planificador-tabs";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyPlan(): PlanTab {
  const dayId = generateId();
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  return {
    id: generateId(),
    title: "Nuevo Plan de Entrenamiento",
    startDate: today.toISOString().split("T")[0],
    endDate: nextWeek.toISOString().split("T")[0],
    days: [{ id: dayId, number: 1, name: "Día 1" }],
    exercises: [],
    isTemplate: false,
    createdAt: Date.now(),
  };
}

export function usePlanTabs() {
  const [tabs, setTabs] = useState<PlanTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Cargar tabs desde localStorage al iniciar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.tabs && data.tabs.length > 0) {
          setTabs(data.tabs);
          setActiveTabId(data.activeTabId || data.tabs[0].id);
          return;
        }
      } catch (error) {
        console.error("Error loading tabs from localStorage:", error);
      }
    }

    // Si no hay datos guardados, crear el primer plan
    const initialPlan = createEmptyPlan();
    setTabs([initialPlan]);
    setActiveTabId(initialPlan.id);
  }, []);

  // Guardar tabs en localStorage cuando cambien
  useEffect(() => {
    if (tabs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs, activeTabId }));
    }
  }, [tabs, activeTabId]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];

  const createTab = useCallback(() => {
    if (tabs.length >= MAX_TABS) {
      return null;
    }

    // Generar un nombre único para el nuevo plan
    let baseName = "Nuevo Plan de Entrenamiento";
    let counter = 1;
    let newTitle = baseName;
    
    while (tabs.some((tab) => tab.title === newTitle)) {
      counter++;
      newTitle = `${baseName} (${counter})`;
    }

    const newPlan = {
      ...createEmptyPlan(),
      title: newTitle,
    };
    
    setTabs((prev) => [...prev, newPlan]);
    setActiveTabId(newPlan.id);
    return newPlan.id;
  }, [tabs]);

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const newTabs = prev.filter((tab) => tab.id !== tabId);

        // Si cerramos la última tab, crear una nueva
        if (newTabs.length === 0) {
          const newPlan = createEmptyPlan();
          setActiveTabId(newPlan.id);
          return [newPlan];
        }

        // Si cerramos la tab activa, cambiar a otra
        if (tabId === activeTabId) {
          const closedIndex = prev.findIndex((tab) => tab.id === tabId);
          const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
          setActiveTabId(newTabs[newActiveIndex].id);
        }

        return newTabs;
      });
    },
    [activeTabId],
  );

  const updateTab = useCallback((tabId: string, updates: Partial<PlanTab>) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)),
    );
  }, []);

  const updateActiveTab = useCallback(
    (updates: Partial<PlanTab>) => {
      if (activeTabId) {
        updateTab(activeTabId, updates);
      }
    },
    [activeTabId, updateTab],
  );

  const duplicateTab = useCallback(
    (tabId: string) => {
      if (tabs.length >= MAX_TABS) {
        return null;
      }

      const tabToDuplicate = tabs.find((tab) => tab.id === tabId);
      if (!tabToDuplicate) return null;

      // Generar un nombre único para el plan duplicado
      let baseName = `${tabToDuplicate.title}`;
      let counter = 1;
      let newTitle = `${baseName} (Copia)`;
      
      while (tabs.some((tab) => tab.title === newTitle)) {
        counter++;
        newTitle = `${baseName} (Copia ${counter})`;
      }

      const newPlan: PlanTab = {
        ...tabToDuplicate,
        id: generateId(),
        title: newTitle,
        createdAt: Date.now(),
        // Generar nuevos IDs para días y ejercicios
        days: tabToDuplicate.days.map((day) => ({
          ...day,
          id: generateId(),
        })),
      };

      // Mapear los IDs antiguos a los nuevos para los ejercicios
      const dayIdMap = new Map(
        tabToDuplicate.days.map((day, index) => [
          day.id,
          newPlan.days[index].id,
        ]),
      );

      newPlan.exercises = tabToDuplicate.exercises.map((exercise) => ({
        ...exercise,
        id: generateId(),
        day_id: dayIdMap.get(exercise.day_id) || exercise.day_id,
      }));

      setTabs((prev) => [...prev, newPlan]);
      setActiveTabId(newPlan.id);
      return newPlan.id;
    },
    [tabs],
  );

  const clearAllTabs = useCallback(() => {
    const newPlan = createEmptyPlan();
    setTabs([newPlan]);
    setActiveTabId(newPlan.id);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    createTab,
    closeTab,
    updateTab,
    updateActiveTab,
    duplicateTab,
    clearAllTabs,
    maxTabs: MAX_TABS,
    canCreateTab: tabs.length < MAX_TABS,
  };
}
