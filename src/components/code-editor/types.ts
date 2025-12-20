export type FileItem = {
  name: string;
  type: "file" | "folder";
  language?: string;
  children?: FileItem[];
  content?: string;
  path?: string;
  modified?: boolean;
};

export type OpenTab = {
  file: FileItem;
  path: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type PanelType = "terminal" | "problems" | "output" | "debug";
export type ActivityType = "explorer" | "search" | "git" | "extensions" | "settings";
export type EditorMode = "chat" | "fix" | "refactor";
