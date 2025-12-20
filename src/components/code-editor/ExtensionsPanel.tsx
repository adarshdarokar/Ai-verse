import { useState } from "react";
import { Search, Check, Star, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Extension {
  id: string;
  name: string;
  description: string;
  author: string;
  downloads: string;
  rating: number;
  installed: boolean;
  icon: string;
}

const mockExtensions: Extension[] = [
  {
    id: "prettier",
    name: "Prettier",
    description: "Code formatter using prettier",
    author: "Prettier",
    downloads: "32.1M",
    rating: 4.8,
    installed: true,
    icon: "🎨",
  },
  {
    id: "eslint",
    name: "ESLint",
    description: "Integrates ESLint JavaScript into VS Code",
    author: "Microsoft",
    downloads: "28.5M",
    rating: 4.7,
    installed: true,
    icon: "✅",
  },
  {
    id: "gitlens",
    name: "GitLens",
    description: "Supercharge Git within VS Code",
    author: "GitKraken",
    downloads: "21.3M",
    rating: 4.9,
    installed: false,
    icon: "🔍",
  },
  {
    id: "tailwind",
    name: "Tailwind CSS IntelliSense",
    description: "Intelligent Tailwind CSS tooling",
    author: "Tailwind Labs",
    downloads: "10.2M",
    rating: 4.8,
    installed: true,
    icon: "💨",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    description: "AI pair programmer",
    author: "GitHub",
    downloads: "15.8M",
    rating: 4.6,
    installed: false,
    icon: "🤖",
  },
  {
    id: "thunder",
    name: "Thunder Client",
    description: "Lightweight REST API Client",
    author: "Thunder Client",
    downloads: "8.4M",
    rating: 4.9,
    installed: false,
    icon: "⚡",
  },
];

export function ExtensionsPanel() {
  const [search, setSearch] = useState("");
  const [extensions, setExtensions] = useState(mockExtensions);

  const filteredExtensions = extensions.filter(
    (ext) =>
      ext.name.toLowerCase().includes(search.toLowerCase()) ||
      ext.description.toLowerCase().includes(search.toLowerCase())
  );

  const installedExtensions = filteredExtensions.filter((ext) => ext.installed);
  const recommendedExtensions = filteredExtensions.filter((ext) => !ext.installed);

  const toggleInstall = (id: string) => {
    setExtensions((prev) =>
      prev.map((ext) =>
        ext.id === id ? { ...ext, installed: !ext.installed } : ext
      )
    );
  };

  const renderExtension = (ext: Extension) => (
    <div
      key={ext.id}
      className="flex items-start gap-3 p-3 hover:bg-accent/50 cursor-pointer"
    >
      <div className="w-12 h-12 rounded bg-accent flex items-center justify-center text-2xl">
        {ext.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{ext.name}</span>
          {ext.installed && <Check className="w-4 h-4 text-green-400" />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{ext.description}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{ext.author}</span>
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {ext.downloads}
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {ext.rating}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant={ext.installed ? "outline" : "default"}
        className="h-7 text-xs"
        onClick={() => toggleInstall(ext.id)}
      >
        {ext.installed ? "Uninstall" : "Install"}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Extensions in Marketplace"
            className="pl-8 h-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {installedExtensions.length > 0 && (
          <div>
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Installed
            </div>
            {installedExtensions.map(renderExtension)}
          </div>
        )}

        {recommendedExtensions.length > 0 && (
          <div>
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-t border-border">
              Recommended
            </div>
            {recommendedExtensions.map(renderExtension)}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
