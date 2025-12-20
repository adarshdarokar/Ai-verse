import { useState } from "react";
import { X, ChevronDown, ChevronRight, CaseSensitive, Regex, WholeWord, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FindReplaceProps {
  onClose: () => void;
  onFind: (query: string, options: FindOptions) => void;
  onReplace: (replacement: string) => void;
  onReplaceAll: (replacement: string) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  matchCount: number;
  currentMatch: number;
}

export interface FindOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

export function FindReplace({
  onClose,
  onFind,
  onReplace,
  onReplaceAll,
  onFindNext,
  onFindPrevious,
  matchCount,
  currentMatch,
}: FindReplaceProps) {
  const [showReplace, setShowReplace] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  const handleFind = (query: string) => {
    setFindQuery(query);
    onFind(query, { caseSensitive, wholeWord, regex: useRegex });
  };

  return (
    <div className="absolute top-0 right-4 z-50 bg-[#252526] border border-border rounded-b-lg shadow-lg p-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowReplace(!showReplace)}
          className="p-1 hover:bg-accent rounded"
        >
          {showReplace ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-1">
          <Input
            value={findQuery}
            onChange={(e) => handleFind(e.target.value)}
            placeholder="Find"
            className="w-48 h-7 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.shiftKey ? onFindPrevious() : onFindNext();
              }
              if (e.key === "Escape") onClose();
            }}
          />
          <span className="text-xs text-muted-foreground min-w-[60px]">
            {matchCount > 0 ? `${currentMatch} of ${matchCount}` : "No results"}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            size="sm"
            variant={caseSensitive ? "secondary" : "ghost"}
            className="h-6 w-6 p-0"
            onClick={() => {
              setCaseSensitive(!caseSensitive);
              onFind(findQuery, { caseSensitive: !caseSensitive, wholeWord, regex: useRegex });
            }}
            title="Match Case (Alt+C)"
          >
            <CaseSensitive className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={wholeWord ? "secondary" : "ghost"}
            className="h-6 w-6 p-0"
            onClick={() => {
              setWholeWord(!wholeWord);
              onFind(findQuery, { caseSensitive, wholeWord: !wholeWord, regex: useRegex });
            }}
            title="Match Whole Word (Alt+W)"
          >
            <WholeWord className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={useRegex ? "secondary" : "ghost"}
            className="h-6 w-6 p-0"
            onClick={() => {
              setUseRegex(!useRegex);
              onFind(findQuery, { caseSensitive, wholeWord, regex: !useRegex });
            }}
            title="Use Regular Expression (Alt+R)"
          >
            <Regex className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={onFindPrevious}
            title="Previous Match (Shift+Enter)"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={onFindNext}
            title="Next Match (Enter)"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {showReplace && (
        <div className="flex items-center gap-2 mt-2 ml-6">
          <Input
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="Replace"
            className="w-48 h-7 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") onReplace(replaceQuery);
              if (e.key === "Escape") onClose();
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => onReplace(replaceQuery)}
            title="Replace (Ctrl+Shift+1)"
          >
            Replace
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => onReplaceAll(replaceQuery)}
            title="Replace All (Ctrl+Shift+Enter)"
          >
            All
          </Button>
        </div>
      )}
    </div>
  );
}
