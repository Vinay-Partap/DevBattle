import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  Code2,
  Play,
  Send,
  Save,
  RotateCcw,
  Sparkles,
  Terminal,
  Cpu,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  Layers,
  FileCode,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageSquare,
  BarChart2,
  BookOpen,
  ArrowLeft,
  ChevronDown,
  Layout,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge, DifficultyBadge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { useToast } from '../context/ToastContext';
import { Question } from '../types';

export const CodingWorkspacePage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState('// Loading starter code...');
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeBottomTab, setActiveBottomTab] = useState('testcases');
  const [activeRightTab, setActiveRightTab] = useState('ai-hints');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestCases] = useState<any[]>([]);
  const [runtime, setRuntime] = useState<number | null>(null);
  const [memory, setMemory] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchQuestion = async () => {
      if (!problemId) {
        setLoadError('No question was selected.');
        setIsLoadingQuestion(false);
        return;
      }

      setIsLoadingQuestion(true);
      setLoadError('');
      try {
        const token = localStorage.getItem('devbattles.token');
        const res = await fetch(`/api/v1/questions/${problemId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success || !json.data) {
          throw new Error(json?.message || 'Unable to load question.');
        }

        if (!cancelled) {
          const loadedQuestion = json.data as Question;
          setQuestion(loadedQuestion);
          const preferredLanguage = loadedQuestion.starterCode?.typescript
            ? 'typescript'
            : Object.keys(loadedQuestion.starterCode || {})[0] || 'javascript';
          setLanguage(preferredLanguage);
          setCode(loadedQuestion.starterCode?.[preferredLanguage] || '// Start coding here');
          setActiveRightTab(loadedQuestion.type === 'frontend' ? 'preview' : 'ai-hints');
        }
      } catch (err: any) {
        if (!cancelled) setLoadError(err.message || 'Unable to load question.');
      } finally {
        if (!cancelled) setIsLoadingQuestion(false);
      }
    };

    fetchQuestion();
    return () => {
      cancelled = true;
    };
  }, [problemId]);

  const isFrontend = question?.type === 'frontend';

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (question?.starterCode?.[lang]) {
      setCode(question.starterCode[lang]);
    }
  };

  const handleRunCode = () => {
    if (!question) return;
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setRuntime(38);
      setMemory(41.2);
      setTestCases([
        { id: '1', passed: true, input: question.examples[0]?.input || 'sample input', output: question.examples[0]?.output || 'sample output' },
        { id: '2', passed: true, input: 'Edge case [0,0]', output: 'Passed' },
      ]);
      addToast('success', 'Execution Complete!', 'All test cases passed with 38ms runtime.');
    }, 1200);
  };

  const handleSubmitCode = () => {
    if (!question) return;
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      addToast('success', 'Submission Captured', 'Submission Service is not implemented yet, so this run is recorded locally only.');
      navigate('/submissions');
    }, 1500);
  };

  if (isLoadingQuestion) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">
        Loading question from Question Service...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-400" />
        <div>
          <h1 className="text-xl font-black">Question unavailable</h1>
          <p className="text-sm text-slate-400 mt-1">{loadError || 'The selected question could not be loaded.'}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/questions')}>Back to Question Bank</Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* IDE TOP TOOLBAR */}
      <header className="h-12 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/questions')}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Back to Questions"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-indigo-500/20 text-indigo-400">
              <Code2 className="w-4 h-4" />
            </span>
            <h1 className="text-sm font-bold text-white truncate max-w-xs">{question.title}</h1>
            <DifficultyBadge difficulty={question.difficulty} />
          </div>
        </div>

        {/* Center Controls: Run, Submit, Language Selector */}
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none"
          >
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python 3</option>
          </select>

          <Button
            size="sm"
            variant="secondary"
            icon={<Play className="w-3.5 h-3.5" />}
            isLoading={isRunning}
            onClick={handleRunCode}
          >
            Run Code
          </Button>

          <Button
            size="sm"
            variant="glow"
            icon={<Send className="w-3.5 h-3.5" />}
            isLoading={isRunning}
            onClick={handleSubmitCode}
          >
            Submit Solution
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Button size="sm" variant="ghost" icon={<Save className="w-3.5 h-3.5" />}>
            Draft Saved
          </Button>
        </div>
      </header>

      {/* WORKSPACE PANELS SPLIT LAYOUT */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* LEFT PANEL: Problem Description, Requirements & Examples */}
        <div className="col-span-3 border-r border-slate-800 bg-slate-950 flex flex-col overflow-hidden">
          <div className="px-3 border-b border-slate-800">
            <Tabs
              tabs={[
                { id: 'description', label: 'Problem' },
                { id: 'resources', label: 'Resources' },
              ]}
              activeTab={activeLeftTab}
              onChange={setActiveLeftTab}
            />
          </div>

          <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-300 flex-1">
            <div className="space-y-2">
              <h2 className="text-base font-bold text-white">{question.title}</h2>
              <div className="flex flex-wrap gap-1">
                {question.tags.map((t) => (
                  <Badge key={t} variant="indigo" size="sm">{t}</Badge>
                ))}
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-slate-300 space-y-2">
              <p className="whitespace-pre-line leading-relaxed">{question.description}</p>
            </div>

            {question.requirements && question.requirements.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h3 className="font-bold text-white uppercase text-[11px] tracking-wider">Requirements</h3>
                <ul className="list-disc pl-4 space-y-1 text-slate-400">
                  {question.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {question.examples.map((ex, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-mono text-[11px]">
                <span className="text-slate-400 font-bold font-sans block text-xs">Example {idx + 1}:</span>
                <div><strong className="text-indigo-400">Input:</strong> {ex.input}</div>
                <div><strong className="text-emerald-400">Output:</strong> {ex.output}</div>
                {ex.explanation && <p className="text-slate-500 font-sans mt-1 text-[10px]">{ex.explanation}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER PANEL: Monaco Code Editor + Bottom Terminal */}
        <div className="col-span-5 flex flex-col border-r border-slate-800 bg-slate-950 overflow-hidden">
          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || '')}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* BOTTOM TERMINAL & CONSOLE PANEL */}
          <div className="h-44 border-t border-slate-800 bg-slate-950 flex flex-col overflow-hidden">
            <div className="px-3 border-b border-slate-800 flex items-center justify-between">
              <Tabs
                tabs={[
                  { id: 'testcases', label: 'Test Cases' },
                  { id: 'terminal', label: 'Terminal / Console' },
                ]}
                activeTab={activeBottomTab}
                onChange={setActiveBottomTab}
              />
              {runtime !== null && (
                <div className="text-[11px] text-emerald-400 font-mono font-bold">
                  Runtime: {runtime}ms | Memory: {memory}MB
                </div>
              )}
            </div>

            <div className="p-3 overflow-y-auto font-mono text-xs text-slate-300 flex-1 bg-slate-950/90">
              {activeBottomTab === 'testcases' ? (
                <div className="space-y-2">
                  {testResults.length === 0 ? (
                    <div className="text-slate-500 py-2">Click "Run Code" to execute test cases against Monaco Editor.</div>
                  ) : (
                    testResults.map((tc, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Case {idx + 1}: Passed</span>
                        <span className="text-slate-500 ml-auto">Output: {tc.output}</span>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-1 text-[11px]">
                  <p className="text-slate-500">$ devbattles-runner execute --env v8</p>
                  <p className="text-emerald-400">✓ Compilation successful.</p>
                  <p className="text-slate-400">Console log: [0, 1]</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Contextual (DSA AI Hints vs. Frontend Live Browser Preview) */}
        <div className="col-span-4 bg-slate-950 flex flex-col overflow-hidden">
          <div className="px-3 border-b border-slate-800 flex items-center justify-between">
            <Tabs
              tabs={
                isFrontend
                  ? [
                      { id: 'preview', label: 'Live Browser' },
                      { id: 'lighthouse', label: 'Lighthouse & A11y' },
                    ]
                  : [
                      { id: 'ai-hints', label: 'AI Hints' },
                      { id: 'complexity', label: 'Complexity' },
                    ]
              }
              activeTab={activeRightTab}
              onChange={setActiveRightTab}
            />

            {isFrontend && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setViewportMode('desktop')}
                  className={`p-1 rounded ${viewportMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewportMode('tablet')}
                  className={`p-1 rounded ${viewportMode === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewportMode('mobile')}
                  className={`p-1 rounded ${viewportMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
            {isFrontend ? (
              <div className="h-full flex flex-col">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-t-lg flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-white" />
                  <span className="truncate">http://localhost:3000/kanban-preview</span>
                </div>
                <div className="flex-1 bg-slate-900 border-x border-b border-slate-800 rounded-b-lg p-4 overflow-y-auto">
                  {/* Simulated Live Rendered UI Preview */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-white text-base">Kanban Live Output</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="font-bold text-slate-200 block mb-1">To Do</span>
                        <div className="p-2 bg-slate-900 rounded text-[11px] text-slate-300">Implement Auth</div>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="font-bold text-slate-200 block mb-1">In Progress</span>
                        <div className="p-2 bg-slate-900 rounded text-[11px] text-slate-300">Optimize Monaco</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>DevBattles AI Hint Generator</span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    "Consider utilizing a Hash Map to store previously visited target differences. This drops execution from O(n²) down to O(n)."
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block">Target Complexity Goals</span>
                  <div className="flex justify-between text-slate-400">
                    <span>Expected Time Complexity:</span>
                    <strong className="text-emerald-400">O(n)</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Expected Space Complexity:</span>
                    <strong className="text-cyan-400">O(n)</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
