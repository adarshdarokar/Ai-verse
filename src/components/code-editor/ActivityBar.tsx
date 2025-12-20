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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ActivityBarProps {
  active: ActivityType;
  onActivityChange: (activity: ActivityType) => void;
  onRunCode: () => void;
  onDebug: () => void;
}

const activities = [
  { id: "explorer" as ActivityType, icon: Files, label: "Explorer", shortcut: "Ctrl+Shift+E" },
  { id: "search" as ActivityType, icon: Search, label: "Search", shortcut: "Ctrl+Shift+F" },
  { id: "git" as ActivityType, icon: GitBranch, label: "Source Control", shortcut: "Ctrl+Shift+G" },
  { id: "extensions" as ActivityType, icon: Puzzle, label: "Extensions", shortcut: "Ctrl+Shift+X" },
];

export function ActivityBar({ active, onActivityChange, onRunCode, onDebug }: ActivityBarProps) {
  return (
    <div className="w-12 bg-[#333333] flex flex-col items-center py-1 border-r border-border">
      {activities.map((activity) => (
        <Tooltip key={activity.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onActivityChange(activity.id)}
              className={cn(
                "w-12 h-12 flex items-center justify-center relative transition-colors",
                active === activity.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active === activity.id && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
              )}
              <activity.icon className="w-6 h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{activity.label}</p>
            <p className="text-xs text-muted-foreground">{activity.shortcut}</p>
          </TooltipContent>
        </Tooltip>
      ))}
      
      <div className="flex-1" />
      
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onRunCode}
            className="w-12 h-12 flex items-center justify-center text-green-400 hover:text-green-300 transition-colors"
          >
            <Play className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Run Code</p>
          <p className="text-xs text-muted-foreground">F5</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onDebug}
            className="w-12 h-12 flex items-center justify-center text-orange-400 hover:text-orange-300 transition-colors"
          >
            <Bug className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Debug</p>
          <p className="text-xs text-muted-foreground">Ctrl+Shift+D</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onActivityChange("settings")}
            className={cn(
              "w-12 h-12 flex items-center justify-center transition-colors",
              active === "settings"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Settings</p>
          <p className="text-xs text-muted-foreground">Ctrl+,</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
