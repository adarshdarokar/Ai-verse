import { ChevronRight, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  path: string | null;
}

export function Breadcrumbs({ path }: BreadcrumbsProps) {
  if (!path) return null;

  const parts = path.split("/").filter(Boolean);

  return (
    <div className="h-6 px-3 flex items-center gap-1 text-xs bg-[#1e1e1e] border-b border-border overflow-hidden">
      <FileCode className="w-3 h-3 text-muted-foreground shrink-0" />
      {parts.map((part, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          <span
            className={cn(
              "hover:text-primary cursor-pointer truncate",
              index === parts.length - 1 ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {part}
          </span>
        </div>
      ))}
    </div>
  );
}
