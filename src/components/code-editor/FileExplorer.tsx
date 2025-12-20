import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  FileCode,
  FileJson,
  FileText,
  File,
  FilePlus,
  FolderPlus,
  RefreshCw,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { FileItem } from "./types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface FileExplorerProps {
  files: FileItem[];
  selectedFile: FileItem | null;
  onSelectFile: (file: FileItem, path: string) => void;
  onCreateFile?: (path: string, name: string) => void;
  onCreateFolder?: (path: string, name: string) => void;
  onDeleteFile?: (path: string) => void;
  onRefresh?: () => void;
}

const getFileIcon = (name: string, isOpen?: boolean) => {
  if (name.endsWith(".tsx") || name.endsWith(".jsx")) return <FileCode className="w-4 h-4 text-blue-400" />;
  if (name.endsWith(".ts") || name.endsWith(".js")) return <FileCode className="w-4 h-4 text-yellow-400" />;
  if (name.endsWith(".json")) return <FileJson className="w-4 h-4 text-yellow-500" />;
  if (name.endsWith(".css") || name.endsWith(".scss")) return <FileCode className="w-4 h-4 text-purple-400" />;
  if (name.endsWith(".md")) return <FileText className="w-4 h-4 text-blue-300" />;
  if (name.endsWith(".html")) return <FileCode className="w-4 h-4 text-orange-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
};

export function FileExplorer({
  files,
  selectedFile,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onRefresh,
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src", "src/components", "src/hooks"]));
  const [isCreating, setIsCreating] = useState<{ type: "file" | "folder"; path: string } | null>(null);
  const [newName, setNewName] = useState("");

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleCreate = () => {
    if (isCreating && newName.trim()) {
      if (isCreating.type === "file") {
        onCreateFile?.(isCreating.path, newName.trim());
      } else {
        onCreateFolder?.(isCreating.path, newName.trim());
      }
    }
    setIsCreating(null);
    setNewName("");
  };

  const renderFileTree = (items: FileItem[], path: string = "", depth: number = 0) => {
    return items.map((item) => {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      const isExpanded = expandedFolders.has(fullPath);
      const isSelected = selectedFile?.name === item.name;

      if (item.type === "folder") {
        return (
          <div key={fullPath}>
            <div
              className={cn(
                "group flex items-center gap-1 px-2 py-1 hover:bg-accent/50 cursor-pointer text-sm",
                "transition-colors"
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => toggleFolder(fullPath)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="truncate flex-1">{item.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-accent rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating({ type: "file", path: fullPath });
                    setExpandedFolders(prev => new Set([...prev, fullPath]));
                  }}>
                    <FilePlus className="w-4 h-4 mr-2" />
                    New File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating({ type: "folder", path: fullPath });
                    setExpandedFolders(prev => new Set([...prev, fullPath]));
                  }}>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Folder
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile?.(fullPath);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {isExpanded && (
              <div>
                {isCreating?.path === fullPath && (
                  <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>
                    {isCreating.type === "file" ? (
                      <File className="w-4 h-4" />
                    ) : (
                      <Folder className="w-4 h-4" />
                    )}
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreate();
                        if (e.key === "Escape") {
                          setIsCreating(null);
                          setNewName("");
                        }
                      }}
                      onBlur={handleCreate}
                      className="h-5 text-sm py-0 px-1"
                      autoFocus
                      placeholder={isCreating.type === "file" ? "filename.ts" : "folder-name"}
                    />
                  </div>
                )}
                {item.children && renderFileTree(item.children, fullPath, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          key={fullPath}
          className={cn(
            "group flex items-center gap-2 px-2 py-1 hover:bg-accent/50 cursor-pointer text-sm transition-colors",
            isSelected && "bg-accent"
          )}
          style={{ paddingLeft: `${depth * 12 + 24}px` }}
          onClick={() => onSelectFile(item, fullPath)}
        >
          {getFileIcon(item.name)}
          <span className="truncate flex-1">{item.name}</span>
          <button 
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/20 rounded text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile?.(fullPath);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border">
        <span>Explorer</span>
        <div className="flex items-center gap-1">
          <button 
            className="p-1 hover:bg-accent rounded"
            onClick={() => setIsCreating({ type: "file", path: "" })}
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button 
            className="p-1 hover:bg-accent rounded"
            onClick={() => setIsCreating({ type: "folder", path: "" })}
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-accent rounded" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {isCreating?.path === "" && (
            <div className="flex items-center gap-1 px-2 py-1">
              {isCreating.type === "file" ? (
                <File className="w-4 h-4" />
              ) : (
                <Folder className="w-4 h-4" />
              )}
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setIsCreating(null);
                    setNewName("");
                  }
                }}
                onBlur={handleCreate}
                className="h-5 text-sm py-0 px-1"
                autoFocus
              />
            </div>
          )}
          {renderFileTree(files)}
        </div>
      </ScrollArea>
    </div>
  );
}
