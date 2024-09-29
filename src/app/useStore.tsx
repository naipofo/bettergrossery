"use client";
import { create } from "zustand";
import { AnalysisResponse } from "./page";
import { DEFAULT_SHOPPING_LIST, useSettingsStore } from "./useSettingsStore";
import { HealthResponse } from "./server/analize";

export type Task = {
  id: string;
  title: string;
  checked: boolean;
  analysisResponse: AnalysisResponse | null | "in progress";
};
type ShoppingList = {
  id: string;
  name: string;
  tasks: Task[];
  recipeUrl?: string;
};
type StoreState = {
  lists: ShoppingList[];
  addTask: (listId: string, task: Task) => void;
  removeTask: (listId: string, taskId: string) => void;
  toggleTaskChecked: (listId: string, taskId: string) => void;
  addAnalysisResult: (
    listId: string,
    taskId: string,
    result: HealthResponse | "error",
  ) => void;
  addList: (newList: ShoppingList) => void;
  removeList: (listId: string) => void;
  replaceItem: (listId: string, taskId: string, newTitle: string) => void;
  removeSuggestion: (listId: string, taskId: string) => void;
};
export const useStore = create<StoreState>((set) => ({
  lists: [
    {
      id: DEFAULT_SHOPPING_LIST,
      name: "Default List",
      tasks: [],
    },
  ],
  addTask: (listId, task) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, tasks: [...list.tasks, task] } : list,
      ),
    })),
  removeTask: (listId, taskId) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? { ...list, tasks: list.tasks.filter((task) => task.id !== taskId) }
          : list,
      ),
    })),
  toggleTaskChecked: (listId, taskId) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              tasks: list.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      checked: !task.checked,
                      analysisResponse: task.checked
                        ? task.analysisResponse
                        : null,
                    }
                  : task,
              ),
            }
          : list,
      ),
    })),
  addAnalysisResult: (listId, taskId, result) => {
    if (typeof result === "string") return;
    return set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              tasks: list.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      analysisResponse: {
                        showRemove: false,
                        showWarning: result.isAllergy,
                        alternatives: result.alternatives,
                        hint: result.message,
                      },
                    }
                  : task,
              ),
            }
          : list,
      ),
    }));
  },
  addList: (newList) =>
    set((state) => ({
      lists: [...state.lists, newList],
    })),
  removeList: (listId) =>
    set((state) => {
      const newLists = state.lists.filter((list) => list.id !== listId);
      const currentList = useSettingsStore.getState().currentList;
      if (currentList === listId) {
        useSettingsStore.getState().setCurrentList(DEFAULT_SHOPPING_LIST);
      }
      return { lists: newLists };
    }),
  replaceItem: (listId, taskId, newTitle) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              tasks: list.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, title: newTitle, analysisResponse: null }
                  : task,
              ),
            }
          : list,
      ),
    })),
  removeSuggestion: (listId, taskId) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              tasks: list.tasks.map((task) =>
                task.id === taskId ? { ...task, analysisResponse: null } : task,
              ),
            }
          : list,
      ),
    })),
}));
