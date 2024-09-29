/** eslint-disable @next/next/no-img-element */
"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Leaf, Settings, Trash, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState, useRef } from "react";
import { analizeFoodItemAction } from "./server/analize";
import { useStore, Task } from "./useStore";
import { DEFAULT_SHOPPING_LIST, useSettingsStore } from "./useSettingsStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { scrapeRecepeAction } from "./server/recepescrape";
import { SettingsPage } from "./settings";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { motion, AnimatePresence } from "framer-motion";
import { Kalam } from "next/font/google";

const kalam = Kalam({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "300"],
});

export type AnalysisResponse = {
  hint?: string;
  alternatives?: { name: string; isVegan: boolean }[];
  showWarning: boolean;
  showRemove: boolean;
};

export default function Home() {
  const { currentList } = useSettingsStore();

  return <ShoppingList listName={currentList} />;
}

type ShoppingListProps = {
  listName: string;
};

function ShoppingList({ listName }: ShoppingListProps) {
  const { lists, addTask, addAnalysisResult } = useStore();
  const { healthLevel, allergies, suggestVegan } = useSettingsStore();
  const shoppingListData = lists.find((list) => list.id === listName);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const listEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAddTask = async () => {
    if (newTaskTitle.trim() && shoppingListData) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        checked: false,
        analysisResponse: "in progress",
      };
      addTask(shoppingListData.id, newTask);
      setNewTaskTitle("");
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      const formData = new FormData();
      formData.append("input", newTask.title);
      const analysisResult = await analizeFoodItemAction(
        formData,
        healthLevel,
        allergies,
        suggestVegan,
      );
      if (
        "message" in analysisResult &&
        typeof analysisResult.message === "object"
      ) {
        addAnalysisResult(
          shoppingListData.id,
          newTask.id,
          analysisResult.message,
        );
      } else {
        addAnalysisResult(shoppingListData.id, newTask.id, "error");
      }
    }
  };

  const [animationParent] = useAutoAnimate();

  return (
    <motion.div
      className="flex flex-col h-screen"
      ref={animationParent}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ShoppingListHeader listName={listName} listData={shoppingListData} />
      <main className="flex-grow overflow-y-auto p-4">
        {shoppingListData?.tasks.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center h-full text-gray-500"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src="https://i.imgur.com/tUYoegX.png"
              alt="Empty list"
              className="mb-4 opacity-50 pr-10"
              width={200}
              height={200}
            />
            <p className="text-xl font-semibold">Your list is empty</p>
            <p className="text-sm">
              Add a new item to start your health journey
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {shoppingListData?.tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ListItem task={task} listId={shoppingListData.id} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={listEndRef} />
      </main>
      <motion.footer
        className="bg-gray-100 p-4 flex gap-4"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          className={kalam.className}
        />
        <Button variant="outline" onClick={handleAddTask}>
          +
        </Button>
      </motion.footer>
    </motion.div>
  );
}

type ShoppingListHeaderProps = {
  listName: string;
  listData?: { name: string };
};

function ShoppingListHeader({ listName, listData }: ShoppingListHeaderProps) {
  return (
    <motion.header
      className="text-black p-4 border-b border-black flex justify-between items-center"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ListSelectionDialog listName={listName} listData={listData} />
      <SettingsDialog />
    </motion.header>
  );
}

type ListSelectionDialogProps = {
  listName: string;
  listData?: { name: string };
};

function ListSelectionDialog({ listName, listData }: ListSelectionDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-2xl font-bold">
          {listData?.name}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select or Create Shopping List</DialogTitle>
          <DialogDescription>
            Choose an existing shopping list or create a new one.
          </DialogDescription>
        </DialogHeader>
        <ListSelectionContent listName={listName} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ListSelectionContentProps = {
  listName: string;
};

function ListSelectionContent({ listName }: ListSelectionContentProps) {
  const { lists, removeList } = useStore();
  const { setCurrentList } = useSettingsStore();
  const [newListName, setNewListName] = useState("");
  const [recipeURL, setRecipeURL] = useState("");

  return (
    <div className="mt-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Your Shopping Lists</h3>
        <ul className="max-h-56 overflow-y-auto">
          <AnimatePresence>
            {lists.map((list) => (
              <motion.li
                key={list.id}
                className="my-2 flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DialogClose asChild>
                  <Button
                    variant={list.id === listName ? "default" : "outline"}
                    onClick={() => {
                      setCurrentList(list.id);
                    }}
                    className="flex-grow"
                  >
                    {list.name}
                  </Button>
                </DialogClose>
                {lists.length > 1 && list.id !== DEFAULT_SHOPPING_LIST && (
                  <Button
                    variant="ghost"
                    onClick={() => removeList(list.id)}
                    className="ml-2"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
      <NewListElement
        newListName={newListName}
        setNewListName={setNewListName}
        recipeURL={recipeURL}
        setRecipeURL={setRecipeURL}
      />
    </div>
  );
}

function SettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <SettingsPage />
      </DialogContent>
    </Dialog>
  );
}

type NewListElementProps = {
  newListName: string;
  setNewListName: (name: string) => void;
  recipeURL: string;
  setRecipeURL: (url: string) => void;
};

function NewListElement({
  newListName,
  setNewListName,
  recipeURL,
  setRecipeURL,
}: NewListElementProps) {
  const { addList } = useStore();
  const { setCurrentList } = useSettingsStore();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateListFromRecipe = async () => {
    if (!recipeURL.trim()) return false;
    setIsAdding(true);
    setError(null);

    const formData = new FormData();
    formData.append("input", recipeURL.trim());

    try {
      const analysisResult = await scrapeRecepeAction(formData);

      if ("message" in analysisResult && analysisResult.message.items) {
        const newListId = Date.now().toString();
        const newListName = analysisResult.message.name
          ? `${analysisResult.message.name} - ${new Date().toLocaleDateString()}`
          : `Recipe List ${new Date().toLocaleDateString()}`;
        const newTasks = analysisResult.message.items.map((item, index) => ({
          id: `${newListId}-${index}`,
          title: item,
          checked: false,
          analysisResponse: null,
        }));

        addList({
          id: newListId,
          name: newListName,
          tasks: newTasks,
        });

        setCurrentList(newListId);
        setRecipeURL("");
        return true;
      } else {
        throw new Error("Error fetching recipe items");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      className="mt-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-lg font-semibold">Create New Shopping List</h3>
      <div className="flex items-center mt-2">
        <Input
          placeholder="New list name"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
        />
        <DialogClose asChild>
          <Button
            className="ml-2"
            onClick={() => {
              const newListId = Date.now().toString();
              const trimmedName = newListName.trim();
              if (!trimmedName) return;
              addList({
                id: newListId,
                name: trimmedName,
                tasks: [],
              });
              setCurrentList(newListId);
              setNewListName("");
            }}
          >
            📝 Create Empty List
          </Button>
        </DialogClose>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Create from Recipe</h3>
        <div className="flex items-center mt-2">
          <Input
            placeholder="Recipe URL"
            value={recipeURL}
            onChange={(e) => setRecipeURL(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                const success = await handleCreateListFromRecipe();
                if (success) {
                  e.currentTarget.closest("dialog")?.close();
                }
              }
            }}
          />
          <Button
            className="ml-2"
            onClick={async () => {
              const success = await handleCreateListFromRecipe();
              if (success) {
                document.querySelector("dialog")?.close();
              }
            }}
            disabled={isAdding}
          >
            {isAdding ? "Adding..." : "🌐 Create from Recipe"}
          </Button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </motion.div>
  );
}

type ListItemProps = {
  task: Task;
  listId: string;
  debugView?: boolean;
};

function ListItem({ task, listId, debugView }: ListItemProps) {
  const { removeTask, toggleTaskChecked, replaceItem, removeSuggestion } =
    useStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-2">
        <div className="flex items-center p-4">
          <Checkbox
            id={`checkbox-${task.id}`}
            className="w-5 h-5 mr-4"
            checked={task.checked}
            onCheckedChange={() => toggleTaskChecked(listId, task.id)}
          />
          <span
            className={`font-bold ${task.checked ? "line-through" : ""} ${kalam.className}`}
          >
            {task.title}
          </span>
          <div className="flex-grow"></div>
          <Button variant="ghost" onClick={() => removeTask(listId, task.id)}>
            <Trash className="w-4 h-4" />
          </Button>
        </div>
        {debugView && (
          <pre className="px-4 pb-4 text-xs overflow-x-auto">
            {JSON.stringify(task.analysisResponse, null, 2)}
          </pre>
        )}
        {!task.checked && (
          <TaskAnalysisResponse
            task={task}
            listId={listId}
            removeTask={removeTask}
            replaceItem={replaceItem}
            removeSuggestion={removeSuggestion}
          />
        )}
      </Card>
    </motion.div>
  );
}

type TaskAnalysisResponseProps = {
  task: Task;
  listId: string;
  removeTask: (listId: string, taskId: string) => void;
  replaceItem: (listId: string, taskId: string, newTitle: string) => void;
  removeSuggestion: (listId: string, taskId: string) => void;
};

function TaskAnalysisResponse({
  task,
  listId,
  removeTask,
  replaceItem,
  removeSuggestion,
}: TaskAnalysisResponseProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (
    !task.analysisResponse ||
    typeof task.analysisResponse !== "object" ||
    !task.analysisResponse.hint
  ) {
    return null;
  }

  const handleRemoveSuggestion = () => {
    setIsVisible(false);
    setTimeout(() => removeSuggestion(listId, task.id), 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="px-4 pb-4"
          initial={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center">
            <span
              className={`${
                task.analysisResponse.showWarning
                  ? "text-amber-700"
                  : "text-gray-500"
              }`}
            >
              {task.analysisResponse.showWarning && "⚠️ "}
              {task.analysisResponse.hint}
            </span>
          </div>
          {(task.analysisResponse.showRemove ||
            task.analysisResponse.alternatives) && (
            <div className="mt-2 flex flex-wrap gap-y-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-sm mr-2"
                onClick={handleRemoveSuggestion}
              >
                <span className="sr-only sm:not-sr-only">
                  Remove suggestion
                </span>
                <X className="w-4 h-4 mr-1" />
              </Button>
              {task.analysisResponse.showRemove && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-sm mr-2 text-red-500 border-red-500 hover:bg-red-100"
                  onClick={() => removeTask(listId, task.id)}
                >
                  <Trash className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              )}
              {task.analysisResponse.alternatives?.map((alt, index) => (
                <AlternativeChip
                  key={index}
                  name={alt.name}
                  isVegan={alt.isVegan}
                  onClick={() => replaceItem(listId, task.id, alt.name)}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type AlternativeChipProps = {
  name: string;
  isVegan: boolean;
  onClick: () => void;
};

const AlternativeChip = ({ name, isVegan, onClick }: AlternativeChipProps) => (
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Button
      size="sm"
      variant="outline"
      className="h-7 gap-1 text-sm mr-2"
      onClick={onClick}
      title={isVegan ? "This option is vegan" : ""}
    >
      <span className="sr-only sm:not-sr-only">{name}</span>
      {isVegan && <Leaf className="h-3.5 w-3.5 text-green-500" />}
    </Button>
  </motion.div>
);
