import { useRef, useEffect, useState, useCallback } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CodePaneProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
  onSave?: () => void;
  showMinimap?: boolean;
  lineNumbers?: boolean;
  highlightLine?: number;
  readOnly?: boolean;
}

const languageMap: Record<string, string> = {
  tsx: "tsx",
  ts: "typescript",
  typescript: "typescript",
  js: "javascript",
  jsx: "jsx",
  json: "json",
  css: "css",
  scss: "css",
  html: "markup",
  md: "markdown",
  markdown: "markdown",
  plaintext: "markup",
};

export function CodePane({
  code,
  language,
  onChange,
  onSave,
  showMinimap = true,
  lineNumbers = true,
  highlightLine,
  readOnly = false,
}: CodePaneProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorColumn, setCursorColumn] = useState(1);

  const mappedLanguage = languageMap[language] || "markup";
  const lines = code.split("\n");

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setScrollTop(target.scrollTop);
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = target.scrollTop;
    }
    if (highlightRef.current) {
      highlightRef.current.scrollTop = target.scrollTop;
      highlightRef.current.scrollLeft = target.scrollLeft;
    }
  };

  const updateCursorPosition = useCallback(() => {
    if (!textareaRef.current) return;
    const { selectionStart, value } = textareaRef.current;
    const textBeforeCursor = value.substring(0, selectionStart);
    const linesBeforeCursor = textBeforeCursor.split("\n");
    setCursorLine(linesBeforeCursor.length);
    setCursorColumn(linesBeforeCursor[linesBeforeCursor.length - 1].length + 1);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave?.();
    }

    // Handle Tab
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = code.substring(0, start) + "  " + code.substring(end);
      onChange(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }

    // Auto-close brackets
    const pairs: Record<string, string> = {
      "(": ")",
      "[": "]",
      "{": "}",
      '"': '"',
      "'": "'",
      "`": "`",
    };

    if (pairs[e.key]) {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const selectedText = code.substring(start, end);
      const newValue =
        code.substring(0, start) +
        e.key +
        selectedText +
        pairs[e.key] +
        code.substring(end);
      onChange(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 1;
      }, 0);
    }
  };

  useEffect(() => {
    updateCursorPosition();
  }, [code, updateCursorPosition]);

  return (
    <div className="flex-1 flex relative overflow-hidden bg-[#1e1e1e]">
      {/* Line Numbers */}
      {lineNumbers && (
        <div
          ref={lineNumbersRef}
          className="w-14 bg-[#1e1e1e] text-muted-foreground text-right pr-3 py-2 font-mono text-sm select-none overflow-hidden border-r border-border/50"
          style={{ lineHeight: "1.5rem" }}
        >
          {lines.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-6",
                cursorLine === i + 1 && "text-foreground bg-accent/30",
                highlightLine === i + 1 && "bg-yellow-500/20"
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Syntax Highlighted Background */}
        <div
          ref={highlightRef}
          className="absolute inset-0 overflow-hidden pointer-events-none p-2 font-mono text-sm"
          style={{ lineHeight: "1.5rem" }}
          aria-hidden="true"
        >
          <Highlight theme={themes.vsDark} code={code} language={mappedLanguage as any}>
            {({ tokens, getLineProps, getTokenProps }) => (
              <pre className="!bg-transparent !m-0 !p-0">
                {tokens.map((line, i) => (
                  <div
                    key={i}
                    {...getLineProps({ line })}
                    className={cn(
                      "h-6",
                      cursorLine === i + 1 && "bg-accent/20",
                      highlightLine === i + 1 && "bg-yellow-500/20"
                    )}
                  >
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>

        {/* Textarea for Input */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => {
            onChange(e.target.value);
            updateCursorPosition();
          }}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          onClick={updateCursorPosition}
          onKeyUp={updateCursorPosition}
          readOnly={readOnly}
          className="absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-white font-mono text-sm p-2 outline-none"
          style={{ lineHeight: "1.5rem" }}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
        />
      </div>

      {/* Minimap */}
      {showMinimap && (
        <div className="w-24 bg-[#1e1e1e] border-l border-border/50 overflow-hidden">
          <div className="transform scale-[0.1] origin-top-left w-[1000%] opacity-50">
            <Highlight theme={themes.vsDark} code={code} language={mappedLanguage as any}>
              {({ tokens, getLineProps, getTokenProps }) => (
                <pre className="!bg-transparent !m-0 !p-0 text-[10px]">
                  {tokens.slice(0, 100).map((line, i) => (
                    <div key={i} {...getLineProps({ line })}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>
          {/* Viewport indicator */}
          <div
            className="absolute right-0 w-24 bg-primary/20 border border-primary/40"
            style={{
              top: `${(scrollTop / (lines.length * 24)) * 100}%`,
              height: "20%",
            }}
          />
        </div>
      )}

      {/* Cursor position indicator */}
      <div className="absolute bottom-0 right-0 px-2 py-0.5 text-xs text-muted-foreground bg-[#252526]">
        Ln {cursorLine}, Col {cursorColumn}
      </div>
    </div>
  );
}
