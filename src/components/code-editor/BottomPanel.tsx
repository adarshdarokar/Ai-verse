import { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  AlertCircle,
  FileOutput,
  Bug,
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { PanelType } from "./types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BottomPanelProps {
  activePanel: PanelType;
  onPanelChange: (panel: PanelType) => void;
  onClose: () => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  terminalOutput: string[];
  problems: { type: "error" | "warning"; message: string; file: string; line: number }[];
  output: string[];
  onTerminalCommand?: (command: string) => void;
  onClearOutput?: () => void;
}

const panels: { id: PanelType; label: string; icon: typeof TerminalIcon }[] = [
  { id: "problems", label: "Problems", icon: AlertCircle },
  { id: "output", label: "Output", icon: FileOutput },
  { id: "debug", label: "Debug Console", icon: Bug },
  { id: "terminal", label: "Terminal", icon: TerminalIcon },
];

export function BottomPanel({
  activePanel,
  onPanelChange,
  onClose,
  isMaximized,
  onToggleMaximize,
  terminalOutput,
  problems,
  output,
  onTerminalCommand,
  onClearOutput,
}: BottomPanelProps) {
  const [terminalInput, setTerminalInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalOutput]);

  const handleTerminalSubmit = () => {
    if (terminalInput.trim()) {
      onTerminalCommand?.(terminalInput);
      setCommandHistory(prev => [...prev, terminalInput]);
      setHistoryIndex(-1);
      setTerminalInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTerminalSubmit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput("");
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      onTerminalCommand?.("clear");
    }
  };

  const renderPanelContent = () => {
    switch (activePanel) {
      case "terminal":
        return (
          <div 
            className="p-2 font-mono text-sm h-full cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            <ScrollArea className="h-full">
              {terminalOutput.map((line, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "whitespace-pre-wrap",
                    line.startsWith("$") ? "text-green-400" : "text-muted-foreground"
                  )}
                >
                  {line}
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-green-400 select-none">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent outline-none text-foreground caret-primary"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <div ref={terminalEndRef} />
            </ScrollArea>
          </div>
        );
      case "problems":
        return (
          <div className="p-2">
            {problems.length === 0 ? (
              <div className="text-muted-foreground text-sm p-4 text-center">
                No problems have been detected in the workspace.
              </div>
            ) : (
              <div className="space-y-1">
                {problems.map((problem, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-1 hover:bg-accent/50 rounded cursor-pointer text-sm"
                  >
                    <AlertCircle
                      className={cn(
                        "w-4 h-4",
                        problem.type === "error" ? "text-red-400" : "text-yellow-400"
                      )}
                    />
                    <span className="flex-1">{problem.message}</span>
                    <span className="text-muted-foreground">
                      {problem.file}:{problem.line}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "output":
        return (
          <div className="p-2 font-mono text-sm h-full">
            <ScrollArea className="h-full">
              {output.length === 0 ? (
                <div className="text-muted-foreground p-4 text-center">
                  Run code to see output here. Press F5 or click the Run button.
                </div>
              ) : (
                output.map((line, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "whitespace-pre-wrap",
                      line.startsWith(">") ? "text-cyan-400" : 
                      line.startsWith("✓") ? "text-green-400" : 
                      line.startsWith("✗") || line.startsWith("Error") ? "text-red-400" :
                      line.includes("successfully") ? "text-green-400" :
                      line.startsWith("[") ? "text-yellow-400" :
                      "text-muted-foreground"
                    )}
                  >
                    {line}
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        );
      case "debug":
        return (
          <div className="p-2 font-mono text-sm text-muted-foreground">
            <div className="p-4 text-center">Debug console ready. Start debugging to see output.</div>
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "flex flex-col bg-[#1e1e1e] border-t border-[#3c3c3c]",
      isMaximized ? "h-96" : "h-48"
    )}>
      {/* Panel Tabs */}
      <div className="h-9 flex items-center justify-between border-b border-[#3c3c3c] bg-[#252526] shrink-0">
        <div className="flex items-center">
          {panels.map((panel) => (
            <button
              key={panel.id}
              onClick={() => onPanelChange(panel.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 h-9 text-sm transition-colors border-b-2",
                activePanel === panel.id
                  ? "text-foreground border-primary bg-[#1e1e1e]"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              )}
            >
              <panel.icon className="w-4 h-4" />
              <span>{panel.label}</span>
              {panel.id === "problems" && problems.length > 0 && (
                <span className="ml-1 px-1.5 rounded-full text-xs bg-red-500 text-white">
                  {problems.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 px-2">
          {activePanel === "terminal" && (
            <>
              <button 
                className="p-1 hover:bg-[#3c3c3c] rounded"
                onClick={() => onTerminalCommand?.("clear")}
                title="Clear Terminal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-[#3c3c3c] rounded" title="New Terminal">
                <Plus className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-[#3c3c3c] rounded" title="More Actions">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </>
          )}
          {activePanel === "output" && (
            <button 
              className="p-1 hover:bg-[#3c3c3c] rounded"
              onClick={onClearOutput}
              title="Clear Output"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={onToggleMaximize} className="p-1 hover:bg-[#3c3c3c] rounded">
            {isMaximized ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-[#3c3c3c] rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {renderPanelContent()}
      </div>
    </div>
  );
}
