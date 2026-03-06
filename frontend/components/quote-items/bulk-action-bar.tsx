"use client";

import { useState } from "react";
import { FolderOpen, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { QuoteItem } from "./types";

interface BulkActionBarProps {
  selectedCount: number;
  sections: QuoteItem[];
  onMoveToSection: (sectionId: number) => void;
  onCreateSection: (name: string) => void;
  onClearSelection: () => void;
  onExitSelectionMode: () => void;
}

export function BulkActionBar({
  selectedCount,
  sections,
  onMoveToSection,
  onCreateSection,
  onClearSelection,
  onExitSelectionMode,
}: BulkActionBarProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [showNewSectionInput, setShowNewSectionInput] = useState(false);

  const handleCreateSection = () => {
    const name = newSectionName.trim();
    if (!name) return;
    onCreateSection(name);
    setNewSectionName("");
    setShowNewSectionInput(false);
    setIsPopoverOpen(false);
  };

  const handleMoveToSection = (sectionId: number) => {
    onMoveToSection(sectionId);
    setIsPopoverOpen(false);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 sticky top-0 z-10">
      {/* Left: count + deselect */}
      <div className="flex items-center gap-3">
        <Badge className="bg-blue-600 text-white">
          {selectedCount} {selectedCount === 1 ? "voce selezionata" : "voci selezionate"}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-700 dark:text-blue-300 h-7 px-2"
          onClick={onClearSelection}
        >
          Deseleziona
        </Button>
      </div>

      {/* Right: actions + exit */}
      <div className="flex items-center gap-2">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedCount === 0}
              className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 h-8"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Sposta in sezione
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <div className="space-y-1">
              {sections.length === 0 && !showNewSectionInput && (
                <p className="text-xs text-slate-500 px-2 py-1">
                  Nessuna sezione disponibile
                </p>
              )}
              {sections.map((section) => (
                <button
                  key={section.id}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  onClick={() => handleMoveToSection(section.id!)}
                >
                  <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="truncate">{section.description}</span>
                </button>
              ))}

              {sections.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
              )}

              {showNewSectionInput ? (
                <div className="px-1 space-y-2">
                  <Input
                    autoFocus
                    placeholder="Nome sezione..."
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateSection();
                      if (e.key === "Escape") {
                        setShowNewSectionInput(false);
                        setNewSectionName("");
                      }
                    }}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-7 flex-1 text-xs"
                      onClick={handleCreateSection}
                      disabled={!newSectionName.trim()}
                    >
                      Crea
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => {
                        setShowNewSectionInput(false);
                        setNewSectionName("");
                      }}
                    >
                      Annulla
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-blue-600 dark:text-blue-400"
                  onClick={() => setShowNewSectionInput(true)}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  Crea nuova sezione
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-700"
          onClick={onExitSelectionMode}
          title="Esci dalla selezione"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
