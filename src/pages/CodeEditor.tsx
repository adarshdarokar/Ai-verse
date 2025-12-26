import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  FileItem,
  OpenTab,
  PanelType,
  ActivityType,
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

import { FileCode, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ───────── BASIC JS RUNNER ───────── */
const runJS = (code: string) => {
  const logs: string[] = [];
  try {
    new Function("console", code)({
      log: (...a: any[]) => logs.push(a.join(" ")),
      error: (...a: any[]) => logs.push("ERROR: " + a.join(" ")),
    });
  } catch (e: any) {
    logs.push("ERROR: " + e.message);
  }
  return logs;
};

const CodeEditor = () => {
  /* ───────── STATE ───────── */
  const [files, setFiles] = useState<FileItem[]>(sampleFiles);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const [activity, setActivity] = useState<ActivityType>("explorer");
  const [bottomPanel, setBottomPanel] = useState<PanelType>("terminal");
  const [showBottom, setShowBottom] = useState(true);
  const [maxBottom, setMaxBottom] = useState(false);

  const [cmd, setCmd] = useState(false);
  const [find, setFind] = useState(false);
  const [goto, setGoto] = useState(false);
  const [ai, setAi] = useState(false);

  const [terminal, setTerminal] = useState<string[]>([
    "AIVerse Terminal",
    "Commands: run | ls | touch <file> | mkdir <folder> | clear",
    "",
  ]);
  const [output, setOutput] = useState<string[]>([]);
  const [problems] = useState<any[]>([]);

  /* ───────── DERIVED ───────── */
  const tab = openTabs.find(t => t.path === activeTab);
  const file = tab?.file ?? null;
  const code = file?.content ?? "";
  const lang = file?.language ?? "plaintext";

  /* ───────── FILE TREE HELPERS ───────── */
  const updateTree = (
    list: FileItem[],
    parts: string[],
    updater: (f: FileItem) => FileItem | null
  ): FileItem[] =>
    list
      .map(i => {
        if (i.name === parts[0]) {
          if (parts.length === 1) return updater(i);
          if (!i.children) return i;
          return { ...i, children: updateTree(i.children, parts.slice(1), updater) };
        }
        return i;
      })
      .filter(Boolean) as FileItem[];

  const updateFile = (path: string, content: string) => {
    setFiles(f =>
      updateTree(f, path.split("/"), i => ({ ...i, content, modified: true }))
    );
    setOpenTabs(t =>
      t.map(tab =>
        tab.path === path
          ? { ...tab, file: { ...tab.file, content, modified: true } }
          : tab
      )
    );
  };

  const openFile = (file: FileItem, path: string) => {
    if (file.type === "folder") return;
    setOpenTabs(t =>
      t.find(x => x.path === path)
        ? t
        : [...t, { file: { ...file, path }, path }]
    );
    setActiveTab(path);
  };

  /* ───────── TERMINAL ───────── */
  const terminalCmd = (cmd: string) => {
    const [c, arg] = cmd.trim().split(" ");

    if (c === "clear") {
      setTerminal([
        "AIVerse Terminal",
        "Commands: run | ls | touch <file> | mkdir <folder> | clear",
        "",
      ]);
      return;
    }

    if (c === "ls") {
      setTerminal(t => [
        ...t,
        files.map(f => (f.type === "folder" ? `${f.name}/` : f.name)).join("  "),
      ]);
      return;
    }

    if (c === "touch" && arg) {
      setFiles(f => [
        ...f,
        { name: arg, type: "file", content: "", language: "javascript" },
      ]);
      toast.success(`File created: ${arg}`);
      return;
    }

    if (c === "mkdir" && arg) {
      setFiles(f => [...f, { name: arg, type: "folder", children: [] }]);
      toast.success(`Folder created: ${arg}`);
      return;
    }

    if (c === "run" && file) {
      const out = runJS(file.content ?? "");
      setOutput(o => [...o, `> Running ${file.name}`, ...out, ""]);
      setBottomPanel("output");
      setShowBottom(true);
      return;
    }

    setTerminal(t => [...t, `$ ${cmd}`, "Unknown command"]);
  };

  /* ───────── SHORTCUTS ───────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setShowBottom(v => !v);
      }
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        setCmd(true);
      }
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        setFind(true);
      }
      if (e.ctrlKey && e.key === "g") {
        e.preventDefault();
        setGoto(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ───────── UI ───────── */
  return (
    <div className="h-full flex flex-col bg-[#1D1A16] text-[#F6EDE3]">
      <CommandPalette open={cmd} onOpenChange={setCmd} files={files} onSelectFile={openFile} />
      {find && <FindReplace onClose={() => setFind(false)} />}
      {goto && <GoToLine onClose={() => setGoto(false)} totalLines={code.split("\n").length} currentLine={1} onGoToLine={() => {}} />}

      <div className="flex flex-1 overflow-hidden">
        <ActivityBar active={activity} onActivityChange={setActivity} />

        <div className="w-64 bg-[#24201C]">
          {{
            explorer: <FileExplorer files={files} selectedFile={file} onSelectFile={openFile} />,
            search: <SearchPanel files={files} onSelectResult={p => toast.info(p)} />,
            git: <GitPanel />,
            extensions: <ExtensionsPanel />,
            settings: <SettingsPanel />,
          }[activity]}
        </div>

        <div className="flex-1 flex flex-col">
          <EditorTabs
            tabs={openTabs}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onCloseTab={p => setOpenTabs(t => t.filter(tab => tab.path !== p))}
            modifiedFiles={new Set(openTabs.filter(t => t.file.modified).map(t => t.path))}
          />

          {activeTab && <Breadcrumbs path={activeTab} />}

          <div className="flex-1 bg-[#1A1714]">
            {file ? (
              <CodePane code={code} language={lang} onChange={v => activeTab && updateFile(activeTab, v)} />
            ) : (
              <div className="h-full flex items-center justify-center opacity-50">
                <FileCode size={64} />
              </div>
            )}
          </div>

          {showBottom && (
            <BottomPanel
              activePanel={bottomPanel}
              onPanelChange={setBottomPanel}
              onClose={() => setShowBottom(false)}
              isMaximized={maxBottom}
              onToggleMaximize={() => setMaxBottom(v => !v)}
              terminalOutput={terminal}
              output={output}
              problems={problems}
              onTerminalCommand={terminalCmd}
              onClearOutput={() => setOutput([])}
            />
          )}
        </div>

        {ai && (
          <div className="w-80 bg-[#25221E] border-l border-[#3D332C]">
            <div className="h-10 flex items-center justify-between px-3">
              <span className="flex gap-2"><MessageSquare /> AI</span>
              <Button size="icon" variant="ghost" onClick={() => setAi(false)}><X /></Button>
            </div>
            <AIChat selectedFile={file} code={code} />
          </div>
        )}
      </div>

      <StatusBar language={lang} branch="main" errors={0} warnings={0} />
    </div>
  );
};

export default CodeEditor;
