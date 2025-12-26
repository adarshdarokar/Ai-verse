import {
  Files,
  Search,
  GitBranch,
  Puzzle,
  Settings,
  Play,
  Bug,
} from "lucide-react";
import { ActivityType } from "./types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityBarProps {
  active: ActivityType;
  onActivityChange: (activity: ActivityType) => void;
  onRunCode?: () => void;
  onDebug?: () => void;
}

const activities = [
  { id: "explorer" as ActivityType, icon: Files, label: "Explorer" },
  { id: "search" as ActivityType, icon: Search, label: "Search" },
  { id: "git" as ActivityType, icon: GitBranch, label: "Source Control" },
  { id: "extensions" as ActivityType, icon: Puzzle, label: "Extensions" },
];

export function ActivityBar({
  active,
  onActivityChange,
  onRunCode,
  onDebug,
}: ActivityBarProps) {
  return (
    <div className="w-12 bg-[#333] flex flex-col items-center py-1 border-r">
      {activities.map(a => (
        <Tooltip key={a.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onActivityChange(a.id)}
              className={cn(
                "w-12 h-12 flex items-center justify-center",
                active === a.id
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <a.icon className="w-6 h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{a.label}</TooltipContent>
        </Tooltip>
      ))}

      <div className="flex-1" />

      {onRunCode && (
        <button
          onClick={onRunCode}
          className="w-12 h-12 text-green-400 hover:text-green-300"
        >
          <Play className="w-5 h-5" />
        </button>
      )}

      {onDebug && (
        <button
          onClick={onDebug}
          className="w-12 h-12 text-orange-400 hover:text-orange-300"
        >
          <Bug className="w-5 h-5" />
        </button>
      )}

      <button
        onClick={() => onActivityChange("settings")}
        className={cn(
          "w-12 h-12",
          active === "settings"
            ? "text-white"
            : "text-gray-400 hover:text-white"
        )}
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
}
