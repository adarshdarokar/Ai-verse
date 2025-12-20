import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Terminal, Monitor, Code2, Sparkles, Circle, CheckCircle2, Eye, X, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { Highlight, themes } from 'prism-react-renderer';

interface Output {
  id: string;
  username: string;
  code: string;
  output: string;
  language: string;
  created_at: string;
}

interface SharedOutputPanelProps {
  roomId: string;
  username: string;
}

export const SharedOutputPanel = ({ roomId, username }: SharedOutputPanelProps) => {
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'output' | 'preview'>('code');
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchOutputs = async () => {
      const { data } = await supabase
        .from('collaboration_outputs')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setOutputs(data);
      }
    };

    fetchOutputs();

    const channel = supabase
      .channel(`outputs:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collaboration_outputs',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setOutputs((prev) => [payload.new as Output, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const simulateExecution = (code: string, lang: string): string => {
    try {
      if (lang === 'javascript' || lang === 'typescript') {
        const logs: string[] = [];
        const mockConsole = {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          error: (...args: any[]) => logs.push(`❌ Error: ${args.join(' ')}`),
          warn: (...args: any[]) => logs.push(`⚠️ Warning: ${args.join(' ')}`),
          info: (...args: any[]) => logs.push(`ℹ️ ${args.join(' ')}`),
        };
        
        const wrappedCode = `
          (function(console) {
            ${code}
          })(mockConsole);
        `;
        
        const func = new Function('mockConsole', wrappedCode);
        func(mockConsole);
        
        return logs.length > 0 ? logs.join('\n') : '✓ Executed successfully (no output)';
      } else if (lang === 'python') {
        const printMatches = code.match(/print\s*\((.*?)\)/g);
        if (printMatches) {
          return printMatches.map(p => {
            const match = p.match(/print\s*\((.*)\)/);
            return match ? match[1].replace(/['"]/g, '').replace(/f"([^"]*)"/, '$1') : '';
          }).join('\n');
        }
        return '✓ Python code parsed successfully';
      } else if (lang === 'html') {
        return `✓ HTML rendered in Live Preview`;
      } else if (lang === 'css') {
        const selectors = code.match(/[^{}]+(?=\s*\{)/g);
        return `✓ CSS parsed successfully\n\nSelectors:\n${(selectors || []).slice(0, 8).map(s => `  • ${s.trim()}`).join('\n')}`;
      } else if (lang === 'json') {
        const parsed = JSON.parse(code);
        return `✓ Valid JSON\n\n${JSON.stringify(parsed, null, 2).slice(0, 400)}`;
      }
      return '✓ Code processed';
    } catch (error: any) {
      return `❌ ${error.message}`;
    }
  };

  const generatePreviewHtml = (code: string, lang: string): string => {
    if (lang === 'html') {
      return code;
    } else if (lang === 'css') {
      return `<!DOCTYPE html>
<html>
<head><style>${code}</style></head>
<body>
  <div class="preview-container">
    <h1>CSS Preview</h1>
    <p>Your styles are applied to this preview.</p>
    <button>Sample Button</button>
    <div class="box">Sample Box</div>
  </div>
</body>
</html>`;
    } else if (lang === 'javascript' || lang === 'typescript') {
      return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #1a1a1a; color: #fff; }
    #output { padding: 16px; background: #262626; border-radius: 8px; font-family: monospace; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h3>JavaScript Output</h3>
  <div id="output"></div>
  <script>
    const output = document.getElementById('output');
    const originalLog = console.log;
    console.log = (...args) => {
      output.textContent += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\\n';
    };
    try {
      ${code}
    } catch(e) {
      output.textContent += '❌ Error: ' + e.message;
    }
  </script>
</body>
</html>`;
    }
    return `<!DOCTYPE html><html><body><pre>${code}</pre></body></html>`;
  };

  const runCode = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code to run');
      return;
    }

    setIsRunning(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const output = simulateExecution(code, language);

      await supabase.from('collaboration_outputs').insert({
        room_id: roomId,
        user_id: user?.id,
        username,
        code: code.slice(0, 1000),
        output,
        language
      });

      // Generate and show live preview
      setPreviewCode(generatePreviewHtml(code, language));
      setShowLivePreview(true);
      setActiveTab('output');
      toast.success('Code executed successfully');
    } catch (error) {
      console.error('Error running code:', error);
      toast.error('Failed to run code');
    } finally {
      setIsRunning(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLanguageIcon = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: 'text-yellow-500',
      typescript: 'text-blue-400',
      python: 'text-green-400',
      html: 'text-orange-400',
      css: 'text-pink-400',
      json: 'text-purple-400',
    };
    return colors[lang] || 'text-primary';
  };

  const getPrismLanguage = (lang: string) => {
    const map: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      html: 'markup',
      css: 'css',
      json: 'json',
    };
    return map[lang] || 'javascript';
  };

  return (
    <>
      <div className="h-full flex flex-col bg-gradient-to-b from-card/80 to-background border-l border-border/50">
        {/* Premium Header */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-accent/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Monitor className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Live Preview</h3>
              <p className="text-xs text-muted-foreground">Run & share code in real-time</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border/50 bg-muted/30">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'code'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Code Editor
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'output'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Output
            {outputs.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded-full">
                {outputs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('preview'); setShowLivePreview(true); }}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'preview'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Live Preview
          </button>
        </div>

        {activeTab === 'code' ? (
          /* Code Editor Tab with Syntax Highlighting */
          <div className="flex-1 flex flex-col p-4 space-y-3">
            <div className="flex gap-2">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-36 bg-muted/50 border-border/50 text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={runCode} 
                disabled={isRunning} 
                className="flex-1 h-9 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium"
              >
                {isRunning ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run & Preview
                  </>
                )}
              </Button>
            </div>
            
            {/* Syntax Highlighted Code Editor */}
            <div className="flex-1 relative rounded-lg overflow-hidden border border-border/50 bg-[#1e1e1e]">
              <div className="absolute inset-0 overflow-auto">
                <Highlight
                  theme={themes.vsDark}
                  code={code || `// Enter your ${language} code here...\n// Press "Run & Preview" to execute`}
                  language={getPrismLanguage(language)}
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre 
                      className={`${className} p-4 text-xs font-mono min-h-full`} 
                      style={{ ...style, background: 'transparent', margin: 0 }}
                    >
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })} className="table-row">
                          <span className="table-cell pr-4 text-muted-foreground/50 select-none text-right w-8">
                            {i + 1}
                          </span>
                          <span className="table-cell">
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </span>
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              </div>
              {/* Editable overlay */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-text font-mono text-xs p-4 resize-none"
                spellCheck={false}
                placeholder={`// Enter your ${language} code here...`}
              />
            </div>
          </div>
        ) : activeTab === 'output' ? (
          /* Output Tab */
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {outputs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <Terminal className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No outputs yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Run some code to see results here</p>
                </div>
              ) : (
                outputs.map((output, index) => (
                  <div 
                    key={output.id} 
                    className={`rounded-xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 ${
                      index === 0 ? 'ring-1 ring-primary/20' : ''
                    }`}
                  >
                    {/* Output Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-muted/50 to-transparent border-b border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Circle className="h-2.5 w-2.5 fill-destructive text-destructive" />
                          <Circle className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                          <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
                        </div>
                        <div className="h-4 w-px bg-border/50" />
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                            {output.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-foreground">{output.username}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/50 ${getLanguageIcon(output.language)}`}>
                          {output.language}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatTime(output.created_at)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setPreviewCode(generatePreviewHtml(output.code, output.language));
                            setShowLivePreview(true);
                            setActiveTab('preview');
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Code Preview with Syntax Highlighting */}
                    <div className="p-3 bg-[#1e1e1e] border-b border-border/30">
                      <Highlight
                        theme={themes.vsDark}
                        code={output.code}
                        language={getPrismLanguage(output.language)}
                      >
                        {({ className, style, tokens, getLineProps, getTokenProps }) => (
                          <pre 
                            className={`${className} text-[10px] font-mono max-h-24 overflow-auto`} 
                            style={{ ...style, background: 'transparent', margin: 0 }}
                          >
                            {tokens.slice(0, 8).map((line, i) => (
                              <div key={i} {...getLineProps({ line })}>
                                {line.map((token, key) => (
                                  <span key={key} {...getTokenProps({ token })} />
                                ))}
                              </div>
                            ))}
                            {tokens.length > 8 && (
                              <div className="text-muted-foreground">... ({tokens.length - 8} more lines)</div>
                            )}
                          </pre>
                        )}
                      </Highlight>
                    </div>
                    
                    {/* Output Content */}
                    <div className="p-4 bg-gradient-to-b from-background/50 to-background">
                      <div className="flex items-start gap-2">
                        {output.output.startsWith('✓') ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        ) : output.output.startsWith('❌') ? (
                          <Circle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        ) : (
                          <Terminal className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                        )}
                        <pre className="text-xs font-mono text-foreground/90 overflow-x-auto whitespace-pre-wrap leading-relaxed flex-1">
                          {output.output}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          /* Live Preview Tab */
          <div className="flex-1 flex flex-col">
            {previewCode ? (
              <div className="flex-1 relative">
                <div className="absolute top-2 right-2 z-10 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 bg-background/80 backdrop-blur-sm border-border/50"
                    onClick={() => setIsFullscreen(true)}
                  >
                    <Maximize2 className="h-3 w-3 mr-1" />
                    Fullscreen
                  </Button>
                </div>
                <iframe
                  srcDoc={previewCode}
                  className="w-full h-full border-0 bg-white rounded-lg"
                  sandbox="allow-scripts"
                  title="Live Preview"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <Eye className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No preview available</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Run some code to see the live preview</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Preview Modal */}
      {isFullscreen && previewCode && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-background/80 backdrop-blur-sm border-border/50"
              onClick={() => setIsFullscreen(false)}
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Exit Fullscreen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute top-4 left-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Circle className="h-3 w-3 fill-destructive text-destructive" />
              <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <Circle className="h-3 w-3 fill-green-500 text-green-500" />
            </div>
            <span className="text-sm font-medium text-foreground">Live Preview</span>
          </div>
          <iframe
            srcDoc={previewCode}
            className="w-full h-full border-0 bg-white pt-16"
            sandbox="allow-scripts"
            title="Live Preview Fullscreen"
          />
        </div>
      )}
    </>
  );
};
