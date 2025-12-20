import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Setting {
  id: string;
  category: string;
  label: string;
  description: string;
  type: "toggle" | "select" | "number";
  value: any;
  options?: { value: string; label: string }[];
}

const defaultSettings: Setting[] = [
  {
    id: "fontSize",
    category: "Editor",
    label: "Font Size",
    description: "Controls the font size in pixels",
    type: "number",
    value: 14,
  },
  {
    id: "fontFamily",
    category: "Editor",
    label: "Font Family",
    description: "Controls the font family",
    type: "select",
    value: "JetBrains Mono",
    options: [
      { value: "JetBrains Mono", label: "JetBrains Mono" },
      { value: "Fira Code", label: "Fira Code" },
      { value: "Monaco", label: "Monaco" },
      { value: "Consolas", label: "Consolas" },
    ],
  },
  {
    id: "tabSize",
    category: "Editor",
    label: "Tab Size",
    description: "The number of spaces a tab is equal to",
    type: "number",
    value: 2,
  },
  {
    id: "wordWrap",
    category: "Editor",
    label: "Word Wrap",
    description: "Controls how lines should wrap",
    type: "select",
    value: "on",
    options: [
      { value: "off", label: "Off" },
      { value: "on", label: "On" },
      { value: "wordWrapColumn", label: "Word Wrap Column" },
    ],
  },
  {
    id: "minimap",
    category: "Editor",
    label: "Minimap Enabled",
    description: "Controls whether the minimap is shown",
    type: "toggle",
    value: true,
  },
  {
    id: "lineNumbers",
    category: "Editor",
    label: "Line Numbers",
    description: "Controls the display of line numbers",
    type: "select",
    value: "on",
    options: [
      { value: "off", label: "Off" },
      { value: "on", label: "On" },
      { value: "relative", label: "Relative" },
    ],
  },
  {
    id: "autoSave",
    category: "Files",
    label: "Auto Save",
    description: "Controls auto save of editors",
    type: "select",
    value: "afterDelay",
    options: [
      { value: "off", label: "Off" },
      { value: "afterDelay", label: "After Delay" },
      { value: "onFocusChange", label: "On Focus Change" },
    ],
  },
  {
    id: "formatOnSave",
    category: "Files",
    label: "Format On Save",
    description: "Format a file on save",
    type: "toggle",
    value: true,
  },
  {
    id: "theme",
    category: "Appearance",
    label: "Color Theme",
    description: "Specifies the color theme used in the workbench",
    type: "select",
    value: "dark",
    options: [
      { value: "dark", label: "Dark+ (default dark)" },
      { value: "light", label: "Light+ (default light)" },
      { value: "monokai", label: "Monokai" },
      { value: "dracula", label: "Dracula" },
    ],
  },
  {
    id: "cursorBlinking",
    category: "Editor",
    label: "Cursor Blinking",
    description: "Control the cursor animation style",
    type: "select",
    value: "blink",
    options: [
      { value: "blink", label: "Blink" },
      { value: "smooth", label: "Smooth" },
      { value: "phase", label: "Phase" },
      { value: "expand", label: "Expand" },
    ],
  },
  {
    id: "bracketPairs",
    category: "Editor",
    label: "Bracket Pair Colorization",
    description: "Controls whether bracket pair colorization is enabled",
    type: "toggle",
    value: true,
  },
];

export function SettingsPanel() {
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState(defaultSettings);

  const filteredSettings = settings.filter(
    (s) =>
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filteredSettings.map((s) => s.category))];

  const updateSetting = (id: string, value: any) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, value } : s))
    );
  };

  const renderSetting = (setting: Setting) => (
    <div key={setting.id} className="py-3 border-b border-border last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium">{setting.label}</div>
          <div className="text-xs text-muted-foreground">{setting.description}</div>
        </div>
        <div className="ml-4">
          {setting.type === "toggle" && (
            <Switch
              checked={setting.value}
              onCheckedChange={(checked) => updateSetting(setting.id, checked)}
            />
          )}
          {setting.type === "select" && (
            <Select
              value={setting.value}
              onValueChange={(value) => updateSetting(setting.id, value)}
            >
              <SelectTrigger className="w-40 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {setting.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {setting.type === "number" && (
            <Input
              type="number"
              value={setting.value}
              onChange={(e) => updateSetting(setting.id, parseInt(e.target.value))}
              className="w-20 h-8"
            />
          )}
        </div>
      </div>
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
            placeholder="Search settings"
            className="pl-8 h-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {categories.map((category) => (
            <div key={category} className="mb-4">
              <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <ChevronRight className="w-4 h-4" />
                {category}
              </div>
              {filteredSettings
                .filter((s) => s.category === category)
                .map(renderSetting)}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
