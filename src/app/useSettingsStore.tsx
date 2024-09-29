"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_SHOPPING_LIST = "default";

type SettingsStore = {
  healthLevel: 0 | 1 | 2;
  allergies: string[];
  suggestVegan: boolean;
  currentList: string;
  setHealthLevel: (level: 0 | 1 | 2) => void;
  setAllergies: (allergies: string[]) => void;
  setSuggestVegan: (suggest: boolean) => void;
  setCurrentList: (listId: string) => void;
};
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      healthLevel: 1,
      allergies: [],
      suggestVegan: false,
      currentList: DEFAULT_SHOPPING_LIST,
      setHealthLevel: (level) => set({ healthLevel: level }),
      setAllergies: (allergies) => set({ allergies }),
      setSuggestVegan: (suggest) => set({ suggestVegan: suggest }),
      setCurrentList: (listId) => set({ currentList: listId }),
    }),
    { name: "list-settings" },
  ),
);
