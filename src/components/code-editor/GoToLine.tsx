import { useState } from "react";
import { Input } from "@/components/ui/input";

interface GoToLineProps {
  totalLines: number;
  currentLine: number;
  onGoToLine: (line: number) => void;
  onClose: () => void;
}

export function GoToLine({ totalLines, currentLine, onGoToLine, onClose }: GoToLineProps) {
  const [lineInput, setLineInput] = useState(currentLine.toString());

  const handleSubmit = () => {
    const line = parseInt(lineInput);
    if (!isNaN(line) && line >= 1 && line <= totalLines) {
      onGoToLine(line);
      onClose();
    }
  };

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-[#252526] border border-border rounded-lg shadow-lg p-3 w-72">
      <div className="text-sm text-muted-foreground mb-2">
        Go to Line (1-{totalLines})
      </div>
      <Input
        type="number"
        value={lineInput}
        onChange={(e) => setLineInput(e.target.value)}
        min={1}
        max={totalLines}
        className="h-8"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onClose();
        }}
      />
      <div className="text-xs text-muted-foreground mt-2">
        Current line: {currentLine}
      </div>
    </div>
  );
}
