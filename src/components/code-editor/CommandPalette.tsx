import { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  File,
  Settings,
  Search,
  GitBranch,
  Play,
  Terminal,
  Palette,
  FileCode,
  FolderOpen,
  Save,
  RefreshCw,
} from "lucide-react";
import { FileItem } from "./types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileItem[];
  onSelectFile: (file: FileItem, path: string) => void;
  onCommand: (command: string) => void;
}

const commands = [
  { id: "save", label: "Save File", icon: Save, shortcut: "Ctrl+S" },
  { id: "saveAll", label: "Save All Files", icon: Save, shortcut: "Ctrl+Shift+S" },
  { id: "run", label: "Run Code", icon: Play, shortcut: "F5" },
  { id: "terminal", label: "Toggle Terminal", icon: Terminal, shortcut: "Ctrl+`" },
  { id: "search", label: "Search in Files", icon: Search, shortcut: "Ctrl+Shift+F" },
  { id: "git", label: "Open Source Control", icon: GitBranch, shortcut: "Ctrl+Shift+G" },
  { id: "settings", label: "Open Settings", icon: Settings, shortcut: "Ctrl+," },
  { id: "theme", label: "Change Theme", icon: Palette, shortcut: "" },
  { id: "reload", label: "Reload Window", icon: RefreshCw, shortcut: "Ctrl+Shift+R" },
];

function flattenFiles(files: FileItem[], path: string = ""): { file: FileItem; path: string }[] {
  const result: { file: FileItem; path: string }[] = [];
  
  for (const file of files) {
    const fullPath = path ? `${path}/${file.name}` : file.name;
    if (file.type === "file") {
      result.push({ file, path: fullPath });
    } else if (file.children) {
      result.push(...flattenFiles(file.children, fullPath));
    }
  }
  
  return result;
}

export function CommandPalette({
  open,
  onOpenChange,
  files,
  onSelectFile,
  onCommand,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const flatFiles = flattenFiles(files);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const isFileSearch = !search.startsWith(">");
  const filteredFiles = flatFiles.filter((f) =>
    f.file.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(search.replace(">", "").trim().toLowerCase())
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search files or type > for commands..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {isFileSearch && filteredFiles.length > 0 && (
          <CommandGroup heading="Files">
            {filteredFiles.slice(0, 10).map(({ file, path }) => (
              <CommandItem
                key={path}
                onSelect={() => {
                  onSelectFile(file, path);
                  onOpenChange(false);
                  setSearch("");
                }}
                className="flex items-center gap-2"
              >
                <FileCode className="w-4 h-4 text-muted-foreground" />
                <span>{file.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{path}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {(!isFileSearch || search === "") && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Commands">
              {(search === "" ? commands : filteredCommands).map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => {
                    onCommand(command.id);
                    onOpenChange(false);
                    setSearch("");
                  }}
                  className="flex items-center gap-2"
                >
                  <command.icon className="w-4 h-4 text-muted-foreground" />
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {command.shortcut}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
