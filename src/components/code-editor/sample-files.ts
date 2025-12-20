import { FileItem } from "./types";

export const sampleFiles: FileItem[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "App.tsx",
        type: "file",
        language: "tsx",
        content: `import React from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { useAuth } from './hooks/useAuth';

interface AppProps {
  theme?: 'light' | 'dark';
}

function App({ theme = 'dark' }: AppProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app" data-theme={theme}>
      <Header user={user} />
      <main className="main-content">
        <h1>Welcome to My App</h1>
        {user ? (
          <p>Hello, {user.name}!</p>
        ) : (
          <p>Please sign in to continue.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;`,
      },
      {
        name: "components",
        type: "folder",
        children: [
          {
            name: "Header.tsx",
            type: "file",
            language: "tsx",
            content: `import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user?: User | null;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="header">
      <nav className="nav">
        <a href="/" className="nav-link">Home</a>
        <a href="/about" className="nav-link">About</a>
        <a href="/contact" className="nav-link">Contact</a>
      </nav>
      <div className="user-section">
        {user ? (
          <span className="user-name">{user.name}</span>
        ) : (
          <button className="sign-in-btn">Sign In</button>
        )}
      </div>
    </header>
  );
};`,
          },
          {
            name: "Footer.tsx",
            type: "file",
            language: "tsx",
            content: `import React from 'react';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {year} My App. All rights reserved.</p>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};`,
          },
          {
            name: "Button.tsx",
            type: "file",
            language: "tsx",
            content: `import React from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={cn(
        'button',
        \`button--\${variant}\`,
        \`button--\${size}\`,
        isLoading && 'button--loading',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="spinner" /> : children}
    </button>
  );
};`,
          },
        ],
      },
      {
        name: "hooks",
        type: "folder",
        children: [
          {
            name: "useAuth.ts",
            type: "file",
            language: "typescript",
            content: `import { useState, useEffect } from 'react';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Auth failed'));
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  return { user, isLoading, error };
}`,
          },
          {
            name: "useLocalStorage.ts",
            type: "file",
            language: "typescript",
            content: `import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}`,
          },
        ],
      },
      {
        name: "types.ts",
        type: "file",
        language: "typescript",
        content: `export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export type Theme = 'light' | 'dark' | 'system';`,
      },
      {
        name: "index.css",
        type: "file",
        language: "css",
        content: `:root {
  --primary: #007acc;
  --secondary: #6c757d;
  --background: #1e1e1e;
  --foreground: #d4d4d4;
  --accent: #264f78;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--background);
  color: var(--foreground);
}

.header {
  padding: 1rem 2rem;
  background: #252526;
  border-bottom: 1px solid #3c3c3c;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: var(--foreground);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--primary);
}

.footer {
  padding: 1rem 2rem;
  margin-top: auto;
  background: #252526;
  border-top: 1px solid #3c3c3c;
}

.button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.button--primary {
  background: var(--primary);
  color: white;
}

.button--primary:hover {
  background: #005a9e;
}`,
      },
    ],
  },
  {
    name: "package.json",
    type: "file",
    language: "json",
    content: `{
  "name": "my-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}`,
  },
  {
    name: "tsconfig.json",
    type: "file",
    language: "json",
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,
  },
  {
    name: "README.md",
    type: "file",
    language: "markdown",
    content: `# My App

A modern React application built with TypeScript and Vite.

## Features

- ⚡ Lightning fast HMR with Vite
- 🔷 TypeScript for type safety
- 🎨 Modern CSS with CSS Variables
- 🧪 Testing with Vitest

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
\`\`\`

## Project Structure

\`\`\`
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── types.ts       # TypeScript type definitions
├── App.tsx        # Main application component
└── index.css      # Global styles
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request`,
  },
  {
    name: ".gitignore",
    type: "file",
    language: "plaintext",
    content: `# Dependencies
node_modules/

# Build output
dist/
build/

# Environment files
.env
.env.local
.env.production

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/`,
  },
];

export function getFileByPath(files: FileItem[], path: string): FileItem | null {
  const parts = path.split("/").filter(Boolean);
  let current: FileItem[] = files;
  let found: FileItem | null = null;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const item = current.find((f) => f.name === part);
    if (!item) return null;
    
    if (i === parts.length - 1) {
      found = item;
    } else if (item.children) {
      current = item.children;
    } else {
      return null;
    }
  }

  return found;
}
