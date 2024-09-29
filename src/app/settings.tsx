import React, { useState } from "react";
import { useSettingsStore } from "./useSettingsStore";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash } from "lucide-react";

export function SettingsPage() {
  const {
    suggestVegan,
    setSuggestVegan,
    healthLevel,
    setHealthLevel,
    allergies,
    setAllergies,
  } = useSettingsStore();

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="health-slider">Health Level: {healthLevel}</Label>
        <Slider
          id="health-slider"
          min={0}
          max={2}
          step={1}
          value={[healthLevel]}
          onValueChange={(value) => setHealthLevel(value[0] as 0 | 1 | 2)}
        />
        <p className="text-sm text-gray-500 mt-1">
          Remember, sustainable progress is key! Gradually adopting healthier
          eating habits over time can lead to more lasting and positive effects
          than pushing yourself too hard in a short period.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="vegan-toggle">Vegan Suggestions</Label>
        <Switch
          id="vegan-toggle"
          checked={suggestVegan}
          onCheckedChange={setSuggestVegan}
        />
      </div>
      <AllergyManager allergies={allergies} setAllergies={setAllergies} />
    </div>
  );
}

function AllergyManager({
  allergies,
  setAllergies,
}: {
  allergies: string[];
  setAllergies: (allergies: string[]) => void;
}) {
  const [newAllergy, setNewAllergy] = useState("");

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const handleRemoveAllergy = (index: number) => {
    const updatedAllergies = allergies.filter((_, i) => i !== index);
    setAllergies(updatedAllergies);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddAllergy();
    }
  };

  return (
    <div className="space-y-2">
      <Label>Allergies</Label>
      <div className="flex space-x-2">
        <Input
          value={newAllergy}
          onChange={(e) => setNewAllergy(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Add allergy"
        />
        <Button onClick={handleAddAllergy}>Add</Button>
      </div>
      <div className="space-y-2 mt-2">
        {allergies.map((allergy, index) => (
          <div
            key={index}
            className="flex items-center justify-between border border-gray-300 rounded px-3 py-2 text-sm w-full"
          >
            <span>{allergy}</span>
            <button
              onClick={() => handleRemoveAllergy(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash className="text-red-500 hover:text-red-700" size={16} />
            </button>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Warning: AI insights may not always be accurate. Always check product
        packaging for allergen information.
      </p>
    </div>
  );
}
