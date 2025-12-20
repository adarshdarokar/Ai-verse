import { X, Circle } from "lucide-react";
import { OpenTab } from "./types";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface EditorTabsProps {
  tabs: OpenTab[];
  activeTab: string | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  modifiedFiles: Set<string>;
}

const getFileIcon = (name: string) => {
  if (name.endsWith(".tsx") || name.endsWith(".jsx")) return "text-blue-400";
  if (name.endsWith(".ts") || name.endsWith(".js")) return "text-yellow-400";
  if (name.endsWith(".json")) return "text-yellow-500";
  if (name.endsWith(".css") || name.endsWith(".scss")) return "text-purple-400";
  if (name.endsWith(".md")) return "text-blue-300";
  return "text-muted-foreground";
};

export function EditorTabs({ tabs, activeTab, onSelectTab, onCloseTab, modifiedFiles }: EditorTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="h-9 bg-[#252526] border-b border-border flex items-center">
      <ScrollArea className="w-full">
        <div className="flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.path;
            const isModified = modifiedFiles.has(tab.path);
            
            return (
              <div
                key={tab.path}
                className={cn(
                  "group flex items-center gap-2 px-3 h-9 border-r border-border cursor-pointer transition-colors min-w-0",
                  isActive
                    ? "bg-[#1e1e1e] border-t-2 border-t-primary"
                    : "bg-[#2d2d2d] hover:bg-[#2a2a2a] border-t-2 border-t-transparent"
                )}
                onClick={() => onSelectTab(tab.path)}
              >
                <span className={cn("text-sm truncate max-w-32", getFileIcon(tab.file.name))}>
                  {tab.file.name}
                </span>
                <button
                  className={cn(
                    "p-0.5 rounded hover:bg-accent/50 transition-opacity",
                    isModified ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.path);
                  }}
                >
                  {isModified ? (
                    <Circle className="w-3 h-3 fill-current" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
