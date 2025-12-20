import { useState } from "react";
import {
  Search,
  Replace,
  ChevronDown,
  ChevronRight,
  FileCode,
  X,
  CaseSensitive,
  Regex,
  WholeWord,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FileItem } from "./types";

interface SearchResult {
  file: string;
  line: number;
  content: string;
  matches: { start: number; end: number }[];
}

interface SearchPanelProps {
  files: FileItem[];
  onSelectResult: (file: string, line: number) => void;
}

function searchInFiles(
  files: FileItem[],
  query: string,
  options: { caseSensitive: boolean; regex: boolean; wholeWord: boolean },
  path: string = ""
): SearchResult[] {
  const results: SearchResult[] = [];
  if (!query) return results;

  for (const file of files) {
    const fullPath = path ? `${path}/${file.name}` : file.name;

    if (file.type === "folder" && file.children) {
      results.push(...searchInFiles(file.children, query, options, fullPath));
    } else if (file.content) {
      const lines = file.content.split("\n");
      let searchPattern: RegExp;

      try {
        if (options.regex) {
          searchPattern = new RegExp(query, options.caseSensitive ? "g" : "gi");
        } else {
          const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const pattern = options.wholeWord ? `\\b${escaped}\\b` : escaped;
          searchPattern = new RegExp(pattern, options.caseSensitive ? "g" : "gi");
        }
      } catch {
        return results;
      }

      lines.forEach((line, index) => {
        const matches: { start: number; end: number }[] = [];
        let match;

        while ((match = searchPattern.exec(line)) !== null) {
          matches.push({ start: match.index, end: match.index + match[0].length });
        }

        if (matches.length > 0) {
          results.push({
            file: fullPath,
            line: index + 1,
            content: line.trim(),
            matches,
          });
        }
      });
    }
  }

  return results;
}

export function SearchPanel({ files, onSelectResult }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const results = searchInFiles(files, searchQuery, {
    caseSensitive,
    regex: useRegex,
    wholeWord,
  });

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.file]) {
      acc[result.file] = [];
    }
    acc[result.file].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const toggleFile = (file: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(file)) {
        next.delete(file);
      } else {
        next.add(file);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2 border-b border-border">
        <div className="flex items-center gap-2">
          {showReplace ? (
            <ChevronDown
              className="w-4 h-4 cursor-pointer shrink-0"
              onClick={() => setShowReplace(false)}
            />
          ) : (
            <ChevronRight
              className="w-4 h-4 cursor-pointer shrink-0"
              onClick={() => setShowReplace(true)}
            />
          )}
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="pl-8 h-7"
            />
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              size="sm"
              variant={caseSensitive ? "secondary" : "ghost"}
              className="h-6 w-6 p-0"
              onClick={() => setCaseSensitive(!caseSensitive)}
              title="Match Case"
            >
              <CaseSensitive className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={wholeWord ? "secondary" : "ghost"}
              className="h-6 w-6 p-0"
              onClick={() => setWholeWord(!wholeWord)}
              title="Match Whole Word"
            >
              <WholeWord className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={useRegex ? "secondary" : "ghost"}
              className="h-6 w-6 p-0"
              onClick={() => setUseRegex(!useRegex)}
              title="Use Regular Expression"
            >
              <Regex className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showReplace && (
          <div className="flex items-center gap-2 ml-6">
            <div className="flex-1 relative">
              <Replace className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Replace"
                className="pl-8 h-7"
              />
            </div>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
              Replace
            </Button>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
              All
            </Button>
          </div>
        )}

        {searchQuery && (
          <div className="text-xs text-muted-foreground">
            {results.length} results in {Object.keys(groupedResults).length} files
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          {Object.entries(groupedResults).map(([file, fileResults]) => {
            const isExpanded = expandedFiles.has(file) || expandedFiles.size === 0;

            return (
              <div key={file}>
                <button
                  onClick={() => toggleFile(file)}
                  className="w-full flex items-center gap-2 px-2 py-1 hover:bg-accent/50 text-sm"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span className="truncate flex-1 text-left">{file}</span>
                  <span className="text-muted-foreground">{fileResults.length}</span>
                </button>

                {isExpanded && (
                  <div className="ml-8">
                    {fileResults.map((result, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectResult(result.file, result.line)}
                        className="w-full flex items-start gap-2 px-2 py-0.5 hover:bg-accent/50 text-xs text-left"
                      >
                        <span className="text-muted-foreground shrink-0 w-8">
                          {result.line}
                        </span>
                        <span className="truncate">
                          {result.content.substring(0, 100)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
