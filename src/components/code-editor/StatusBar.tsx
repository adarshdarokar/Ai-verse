import {
  GitBranch,
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  Wifi,
  Layout,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  language?: string;
  encoding?: string;
  lineEnding?: string;
  branch?: string;
  errors?: number;
  warnings?: number;
  isConnected?: boolean;
}

export function StatusBar({
  language = "TypeScript React",
  encoding = "UTF-8",
  lineEnding = "LF",
  branch = "main",
  errors = 0,
  warnings = 0,
  isConnected = true,
}: StatusBarProps) {
  return (
    <div className="h-6 bg-primary flex items-center justify-between px-2 text-xs text-primary-foreground">
      <div className="flex items-center gap-3">
        {/* Branch */}
        <div className="flex items-center gap-1 hover:bg-white/10 px-1 rounded cursor-pointer">
          <GitBranch className="w-3.5 h-3.5" />
          <span>{branch}</span>
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-1 hover:bg-white/10 px-1 rounded cursor-pointer">
          <Check className="w-3.5 h-3.5" />
        </div>

        {/* Problems */}
        <div className="flex items-center gap-2 hover:bg-white/10 px-1 rounded cursor-pointer">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{warnings}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language */}
        <div className="hover:bg-white/10 px-1 rounded cursor-pointer">
          {language}
        </div>

        {/* Encoding */}
        <div className="hover:bg-white/10 px-1 rounded cursor-pointer">
          {encoding}
        </div>

        {/* Line Ending */}
        <div className="hover:bg-white/10 px-1 rounded cursor-pointer">
          {lineEnding}
        </div>

        {/* Layout */}
        <div className="hover:bg-white/10 px-1 rounded cursor-pointer">
          <Layout className="w-3.5 h-3.5" />
        </div>

        {/* Notifications */}
        <div className="hover:bg-white/10 px-1 rounded cursor-pointer">
          <Bell className="w-3.5 h-3.5" />
        </div>

        {/* Connection Status */}
        <div className={cn(
          "flex items-center gap-1 px-1 rounded cursor-pointer",
          isConnected ? "text-primary-foreground" : "text-yellow-300"
        )}>
          <Wifi className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
