import { useState } from "react";
import {
  GitBranch,
  Check,
  X,
  RefreshCw,
  Plus,
  Minus,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  FileCode,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface GitChange {
  file: string;
  status: "modified" | "added" | "deleted" | "untracked";
  staged: boolean;
}

const mockChanges: GitChange[] = [
  { file: "src/App.tsx", status: "modified", staged: true },
  { file: "src/components/Header.tsx", status: "modified", staged: false },
  { file: "src/hooks/useAuth.ts", status: "added", staged: false },
  { file: "src/old-file.ts", status: "deleted", staged: false },
];

export function GitPanel() {
  const [commitMessage, setCommitMessage] = useState("");
  const [changes, setChanges] = useState<GitChange[]>(mockChanges);
  const [expandStaged, setExpandStaged] = useState(true);
  const [expandChanges, setExpandChanges] = useState(true);

  const stagedChanges = changes.filter((c) => c.staged);
  const unstagedChanges = changes.filter((c) => !c.staged);

  const stageFile = (file: string) => {
    setChanges((prev) =>
      prev.map((c) => (c.file === file ? { ...c, staged: true } : c))
    );
  };

  const unstageFile = (file: string) => {
    setChanges((prev) =>
      prev.map((c) => (c.file === file ? { ...c, staged: false } : c))
    );
  };

  const stageAll = () => {
    setChanges((prev) => prev.map((c) => ({ ...c, staged: true })));
  };

  const unstageAll = () => {
    setChanges((prev) => prev.map((c) => ({ ...c, staged: false })));
  };

  const getStatusIcon = (status: GitChange["status"]) => {
    switch (status) {
      case "modified":
        return <span className="text-yellow-400 font-mono text-xs">M</span>;
      case "added":
        return <span className="text-green-400 font-mono text-xs">A</span>;
      case "deleted":
        return <span className="text-red-400 font-mono text-xs">D</span>;
      case "untracked":
        return <span className="text-gray-400 font-mono text-xs">U</span>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-4 h-4" />
          <span className="text-sm font-medium">main</span>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 ml-auto">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <Input
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Message (Ctrl+Enter to commit)"
          className="h-8 text-sm"
        />

        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            className="flex-1 h-7 text-xs"
            disabled={stagedChanges.length === 0 || !commitMessage}
          >
            <Check className="w-3 h-3 mr-1" />
            Commit
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2">
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          {/* Staged Changes */}
          <div>
            <button
              onClick={() => setExpandStaged(!expandStaged)}
              className="w-full flex items-center gap-2 px-3 py-1 hover:bg-accent/50 text-sm"
            >
              {expandStaged ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="flex-1 text-left">Staged Changes</span>
              <span className="text-muted-foreground">{stagedChanges.length}</span>
              {stagedChanges.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    unstageAll();
                  }}
                >
                  <Minus className="w-3 h-3" />
                </Button>
              )}
            </button>

            {expandStaged && (
              <div className="ml-4">
                {stagedChanges.map((change) => (
                  <div
                    key={change.file}
                    className="group flex items-center gap-2 px-2 py-0.5 hover:bg-accent/50 text-sm"
                  >
                    <FileCode className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{change.file}</span>
                    {getStatusIcon(change.status)}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => unstageFile(change.file)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Changes */}
          <div>
            <button
              onClick={() => setExpandChanges(!expandChanges)}
              className="w-full flex items-center gap-2 px-3 py-1 hover:bg-accent/50 text-sm"
            >
              {expandChanges ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="flex-1 text-left">Changes</span>
              <span className="text-muted-foreground">{unstagedChanges.length}</span>
              {unstagedChanges.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    stageAll();
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </button>

            {expandChanges && (
              <div className="ml-4">
                {unstagedChanges.map((change) => (
                  <div
                    key={change.file}
                    className="group flex items-center gap-2 px-2 py-0.5 hover:bg-accent/50 text-sm"
                  >
                    <FileCode className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{change.file}</span>
                    {getStatusIcon(change.status)}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => stageFile(change.file)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
