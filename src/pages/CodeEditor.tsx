import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FileItem, 
  OpenTab, 
  PanelType, 
  ActivityType, 
  Message 
} from "@/components/code-editor/types";

import { ActivityBar } from "@/components/code-editor/ActivityBar";
import { FileExplorer } from "@/components/code-editor/FileExplorer";
import { EditorTabs } from "@/components/code-editor/EditorTabs";
import { Breadcrumbs } from "@/components/code-editor/Breadcrumbs";
import { CodePane } from "@/components/code-editor/CodePane";
import { StatusBar } from "@/components/code-editor/StatusBar";
import { BottomPanel } from "@/components/code-editor/BottomPanel";
import { CommandPalette } from "@/components/code-editor/CommandPalette";
import { SearchPanel } from "@/components/code-editor/SearchPanel";
import { GitPanel } from "@/components/code-editor/GitPanel";
import { ExtensionsPanel } from "@/components/code-editor/ExtensionsPanel";
import { SettingsPanel } from "@/components/code-editor/SettingsPanel";
import { AIChat } from "@/components/code-editor/AIChat";
import { FindReplace } from "@/components/code-editor/FindReplace";
import { GoToLine } from "@/components/code-editor/GoToLine";
import { sampleFiles } from "@/components/code-editor/sample-files";

import { 
  FileCode,
  MessageSquare,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ──────────────────────────────────────────────────────────
//  START CODE EDITOR
// ──────────────────────────────────────────────────────────

const CodeEditor = () => {
  const [files, setFiles] = useState<FileItem[]>(sampleFiles);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const [activeActivity, setActiveActivity] = useState<ActivityType>("explorer");
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [activeBottomPanel, setActiveBottomPanel] = useState<PanelType>("terminal");
  const [isBottomPanelMaximized, setIsBottomPanelMaximized] = useState(false);

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showGoToLine, setShowGoToLine] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "Welcome to AIVerse Terminal",
    "Type 'help' for available commands",
    "",
  ]);

  const [messages] = useState<Message[]>([]);
  const [problems] = useState<{ type: "error" | "warning"; message: string; file: string; line: number }[]>([]);
  const [output, setOutput] = useState<string[]>([]);

  const currentTab = openTabs.find((tab) => tab.path === activeTab);
  const currentFile = currentTab?.file;
  const currentCode = currentFile?.content || "";
  const currentLanguage = currentFile?.language || "plaintext";

  // UPDATE FILE CONTENT
  const updateFileContent = useCallback((path: string, content: string) => {
    setFiles(prev => {
      const updateRecursive = (items: FileItem[], parts: string[]): FileItem[] =>
        items.map(item => {
          if (item.name === parts[0]) {
            if (parts.length === 1) return { ...item, content, modified: true };
            if (item.children) return { ...item, children: updateRecursive(item.children, parts.slice(1)) };
          }
          return item;
        });

      return updateRecursive(prev, path.split("/"));
    });

    setOpenTabs(prev =>
      prev.map(tab =>
        tab.path === path ? { ...tab, file: { ...tab.file, content, modified: true } } : tab
      )
    );
  }, []);

  // SELECT FILE
  const handleSelectFile = useCallback((file: FileItem, path: string) => {
    if (file.type === "folder") return;

    const exists = openTabs.find(tab => tab.path === path);
    if (exists) return setActiveTab(path);

    const newTab: OpenTab = { file: { ...file, path }, path };
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTab(path);
  }, [openTabs]);

  // CLOSE TAB
  const handleCloseTab = useCallback(
    (path: string) => {
      setOpenTabs(prev => {
        const filtered = prev.filter(t => t.path !== path);
        if (activeTab === path) {
          setActiveTab(filtered.length ? filtered[filtered.length - 1].path : null);
        }
        return filtered;
      });
    },
    [activeTab]
  );

  // SAVE FILE
  const handleSaveFile = useCallback(() => {
    if (!activeTab) return;
    setOpenTabs(prev =>
      prev.map(tab =>
        tab.path === activeTab ? { ...tab, file: { ...tab.file, modified: false } } : tab
      )
    );
    toast.success("File saved");
  }, [activeTab]);

  // TERMINAL COMMANDS
  const handleTerminalCommand = useCallback(
    (command: string) => {
      const cmd = command.trim().split(" ")[0];
      setTerminalOutput(prev => [...prev, `$ ${command}`]);

      if (cmd === "clear") setTerminalOutput([]);
      else if (cmd === "help") setTerminalOutput(prev => [...prev, "Commands: help, clear, ls, pwd"]);
      else setTerminalOutput(prev => [...prev, `Unknown command: ${cmd}`]);
    },
    []
  );

  // RUN CODE
  const handleRunCode = useCallback(() => {
    if (!currentFile) return toast.error("No file selected");

    setActiveBottomPanel("output");
    setShowBottomPanel(true);

    setOutput(prev => [
      ...prev,
      `Running ${currentFile.name}...`,
      `No execution engine installed yet.`,
      ""
    ]);
  }, [currentFile]);

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowFindReplace(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault();
        setShowGoToLine(true);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSaveFile]);

  // RENDER SIDE PANEL
  const renderSidePanel = () => {
    switch (activeActivity) {
      case "explorer":
        return (
          <FileExplorer
            files={files}
            selectedFile={currentFile || null}
            onSelectFile={handleSelectFile}
          />
        );

      case "search":
        return (
          <SearchPanel
            files={files}
            onSelectResult={(path) => toast.info(`Navigate to: ${path}`)}
          />
        );

      case "git":
        return <GitPanel />;

      case "extensions":
        return <ExtensionsPanel />;

      case "settings":
        return <SettingsPanel />;

      default:
        return null;
    }
  };

  // ───────────────────────────────────────────────
  //  UI + THEME BELOW 🔥 CLASSY DARK BROWN THEME
  // ───────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-[#1D1A16] text-[#F6EDE3] overflow-hidden select-none">

      {/* COMMAND PALETTE */}
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        files={files}
        onSelectFile={handleSelectFile}
      />

      {/* FIND REPLACE */}
      {showFindReplace && (
        <FindReplace
          onClose={() => setShowFindReplace(false)}
          onFindNext={() => {}}
          onFindPrevious={() => {}}
          onReplace={() => {}}
          onReplaceAll={() => {}}
        />
      )}

      {/* GOTO LINE */}
      {showGoToLine && (
        <GoToLine
          onClose={() => setShowGoToLine(false)}
          totalLines={currentCode.split("\n").length}
          currentLine={cursorPosition.line}
          onGoToLine={(line) => setCursorPosition({ line, column: 1 })}
        />
      )}

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT ACTIVITY BAR */}
        <ActivityBar
          active={activeActivity}
          onActivityChange={setActiveActivity}
          onRunCode={handleRunCode}
          onDebug={() => toast.info("Debugging...")}
          className="bg-[#2C2722] border-r border-[#3D332C]"
        />

        {/* SIDE PANEL */}
        <div className="w-64 bg-[#24201C] border-r border-[#3D332C] shadow-inner overflow-hidden">
          {renderSidePanel()}
        </div>

        {/* EDITOR AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* EDITOR TABS */}
          <EditorTabs
            tabs={openTabs}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onCloseTab={handleCloseTab}
            modifiedFiles={new Set(openTabs.filter(t => t.file.modified).map(t => t.path))}
            className="
              bg-[#2A2420]
              border-b border-[#3D332C]
              [&>.tab]:bg-[#3A322D]
              [&>.tab]:text-[#D6C7B7]
              [&>.tab-active]:bg-[#C7A583]
              [&>.tab-active]:text-[#3A2A20]
              [&>.tab]:border-r border-[#3D332C]
            "
          />

          {/* BREADCRUMBS */}
          {activeTab && (
            <Breadcrumbs
              path={activeTab}
              className="bg-[#24201C] border-b border-[#3D332C] text-[#AD9C8E]"
            />
          )}

          {/* EDITOR PANE */}
          <div className="flex-1 flex overflow-hidden bg-[#1A1714] text-[#F6EDE3]">
            {currentFile ? (
              <CodePane
                code={currentCode}
                language={currentLanguage}
                onChange={(newCode) => activeTab && updateFileContent(activeTab, newCode)}
                onSave={handleSaveFile}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center opacity-60">
                  <FileCode className="w-20 h-20 mx-auto mb-4 opacity-10" />
                  <h2 className="text-xl font-light">AIVerse Editor</h2>
                  <p className="text-sm text-[#B8A89A]">Open a file to start editing</p>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM PANEL */}
          {showBottomPanel && (
            <BottomPanel
              activePanel={activeBottomPanel}
              onPanelChange={setActiveBottomPanel}
              onClose={() => setShowBottomPanel(false)}
              isMaximized={isBottomPanelMaximized}
              onToggleMaximize={() => setIsBottomPanelMaximized(v => !v)}
              terminalOutput={terminalOutput}
              problems={problems}
              output={output}
              onTerminalCommand={handleTerminalCommand}
              onClearOutput={() => setOutput([])}
              className="
                bg-[#24201C]
                border-t border-[#3D332C]
                text-[#E6D7C7]
                [&_.panel-tab]:bg-[#3A322D]
                [&_.panel-tab-active]:bg-[#C7A583] [&_.panel-tab-active]:text-[#3A2A20]
              "
            />
          )}
        </div>

        {/* AI CHAT PANEL */}
        {showAIChat && (
          <div className="w-80 bg-[#25221E] border-l border-[#3D332C] shadow-lg">
            <div className="h-10 px-3 flex items-center justify-between border-b border-[#3D332C] bg-[#2A2520]">
              <span className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> AI Assistant
              </span>
              <Button size="icon" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowAIChat(false)}>
                <X className="w-4 h-4 text-[#EBD8C8]" />
              </Button>
            </div>
            <AIChat selectedFile={currentFile || null} code={currentCode} />
          </div>
        )}
      </div>

      {/* STATUS BAR */}
      <StatusBar
        language={currentLanguage}
        branch="main"
        errors={problems.filter(p => p.type === "error").length}
        warnings={problems.filter(p => p.type === "warning").length}
        className="bg-[#2C2722] border-t border-[#3D332C] text-[#C7B8A7]"
      />

      {/* FLOATING AI BUTTON */}
      {!showAIChat && (
        <Button
          onClick={() => setShowAIChat(true)}
          className="
            fixed bottom-12 right-4
            bg-gradient-to-br from-[#5A3A2D] to-[#3A251C]
            text-[#EBD8C8]
            rounded-full shadow-xl
            hover:opacity-90
          "
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          AI Assistant
        </Button>
      )}
    </div>
  );
};

export default CodeEditor;
