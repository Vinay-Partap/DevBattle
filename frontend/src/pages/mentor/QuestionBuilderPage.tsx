import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Code2, FileText, Play, Plus, Settings, UploadCloud } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { Difficulty, ProblemType, Question } from '../../types';

const QUESTION_TYPES: { id: ProblemType; label: string }[] = [
  { id: 'dsa', label: 'DSA' },
  { id: 'sql', label: 'SQL' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'fullstack', label: 'Full Stack' },
  { id: 'react', label: 'React' },
  { id: 'nodejs', label: 'Node.js' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'html-css', label: 'HTML/CSS' },
  { id: 'bug-fixing', label: 'Bug Fixing' },
  { id: 'debugging', label: 'Debugging' },
  { id: 'mcq', label: 'MCQ' },
  { id: 'system-design', label: 'System Design' },
  { id: 'ai-challenge', label: 'AI Challenge' },
];

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'sql'];
const FRONTEND_TECH = ['HTML', 'CSS', 'Tailwind', 'Bootstrap', 'React', 'Next.js', 'Redux', 'Vue', 'Angular'];
const REQUIRED_FEATURES = [
  'Responsive Design',
  'Dark Mode',
  'Authentication',
  'CRUD',
  'Search',
  'Pagination',
  'Filtering',
  'Sorting',
  'API Integration',
  'Animations',
  'Accessibility',
  'SEO',
  'State Management',
];
const AI_CRITERIA = [
  'Code Readability',
  'Naming Convention',
  'Architecture',
  'Optimization',
  'Best Practices',
  'Security',
  'Performance',
  'Accessibility',
  'Responsive Design',
  'Documentation',
];

const steps = [
  { id: 1, label: 'Basic', icon: <FileText className="w-4 h-4" /> },
  { id: 2, label: 'Statement', icon: <Code2 className="w-4 h-4" /> },
  { id: 3, label: 'Languages', icon: <Play className="w-4 h-4" /> },
  { id: 4, label: 'Test Cases', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 5, label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

const csv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const QuestionBuilderPage: React.FC = () => {
  const { addToast } = useToast();
  const [hasSelectedType, setHasSelectedType] = useState(false);
  const [step, setStep] = useState(1);
  const [drafts, setDrafts] = useState<Question[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ProblemType>('dsa');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');
  const [topics, setTopics] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [maxScore, setMaxScore] = useState(100);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'organization'>('organization');

  const [description, setDescription] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');
  const [notes, setNotes] = useState('');
  const [hints, setHints] = useState('');
  const [editorial, setEditorial] = useState('');
  const [referenceLinks, setReferenceLinks] = useState('');

  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['javascript']);
  const [starterCode, setStarterCode] = useState<Record<string, string>>({
    javascript: 'function solve(input) {\n  // Write your solution here\n}\n',
  });

  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [sampleExplanation, setSampleExplanation] = useState('');
  const [hiddenInput, setHiddenInput] = useState('');
  const [hiddenOutput, setHiddenOutput] = useState('');
  const [hiddenWeight, setHiddenWeight] = useState(1);

  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [maxCodeSizeKb, setMaxCodeSizeKb] = useState(256);
  const [executionTimeoutMs, setExecutionTimeoutMs] = useState(5000);
  const [plagiarismEnabled, setPlagiarismEnabled] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(80);
  const [maxAttempts, setMaxAttempts] = useState('');
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [aiCriteria, setAiCriteria] = useState<string[]>(['Code Readability', 'Best Practices']);
  const [requiredTech, setRequiredTech] = useState<string[]>(['React']);
  const [requiredFeatures, setRequiredFeatures] = useState<string[]>(['Responsive Design']);
  const [requiredFiles, setRequiredFiles] = useState('src/App.jsx');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('Application must be responsive and show proper loading/error states.');
  const [figmaLink, setFigmaLink] = useState('');

  const generatedSlug = useMemo(() => slugify(title), [title]);
  const isFrontendType = ['frontend', 'react', 'html', 'css', 'html-css', 'fullstack'].includes(type);
  const isBackendType = ['backend', 'nodejs', 'fullstack'].includes(type);
  const isSqlType = type === 'sql';
  const isMcqType = type === 'mcq';
  const isDebuggingType = type === 'debugging' || type === 'bug-fixing';
  const isSystemDesignType = type === 'system-design';

  const authHeaders = () => {
    const token = localStorage.getItem('devbattles.token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const res = await fetch('/api/v1/questions?status=draft&limit=50', {
        headers: authHeaders(),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && Array.isArray(json.data?.items)) {
        setDrafts(json.data.items);
      }
    } finally {
      setLoadingDrafts(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const toggle = (value: string, values: string[], setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const toggleLanguage = (language: string) => {
    const next = supportedLanguages.includes(language)
      ? supportedLanguages.filter((item) => item !== language)
      : [...supportedLanguages, language];
    setSupportedLanguages(next);
    setStarterCode((prev) => ({
      ...prev,
      ...Object.fromEntries(next.map((lang) => [lang, prev[lang] ?? `// ${lang} starter code\n`])),
    }));
  };

  const buildPayload = () => ({
    title: title.trim(),
    description: description.trim() || 'Question details will be completed by the teacher.',
    problemStatement: description,
    inputFormat,
    outputFormat,
    notes,
    type,
    difficulty,
    category,
    tags: csv(tags),
    topics: csv(topics),
    technology: isFrontendType ? requiredTech : [],
    requirements: csv(constraints),
    constraints: csv(constraints),
    supportedLanguages,
    maxScore,
    visibility,
    status: 'draft',
    estimatedMinutes,
    timeLimitMs,
    memoryLimitMb,
    maxCodeSizeKb,
    executionTimeoutMs,
    plagiarism: { enabled: plagiarismEnabled, similarityThreshold },
    submission: {
      maxAttempts: maxAttempts ? Number(maxAttempts) : null,
      allowLateSubmission,
    },
    scoring: {
      correctness: 60,
      performance: 15,
      aiReview: 10,
      codeQuality: 10,
      documentation: 5,
      bonus: 0,
    },
    evaluationConfig: {
      evaluator: type,
      correctAnswers: isMcqType ? csv(outputFormat) : undefined,
      sql: isSqlType ? { schema: inputFormat, expectedResult: outputFormat } : undefined,
      api: isBackendType ? { contract: acceptanceCriteria } : undefined,
      deterministic: true,
      requiresIsolatedWorker: !isMcqType,
    },
    typeSpecificConfig: {
      options: isMcqType ? csv(inputFormat) : undefined,
      frontend: isFrontendType ? { requiredTech, requiredFeatures, requiredFiles: csv(requiredFiles), figmaLink } : undefined,
      debugging: isDebuggingType ? { expectedBehavior: outputFormat } : undefined,
    },
    publicMetadata: {
      options: isMcqType ? csv(inputFormat) : undefined,
      requiredTech: isFrontendType ? requiredTech : undefined,
      requiredFeatures: isFrontendType ? requiredFeatures : undefined,
    },
    examples: sampleInput && sampleOutput ? [{ input: sampleInput, output: sampleOutput, explanation: sampleExplanation || null }] : [],
    starterCode: Object.fromEntries(supportedLanguages.map((lang) => [lang, starterCode[lang] ?? ''])),
    testCases: [
      ...(sampleInput && sampleOutput
        ? [{ input: sampleInput, expectedOutput: sampleOutput, explanation: sampleExplanation || null, isSample: true, isHidden: false, weight: 1 }]
        : []),
      ...(hiddenInput && hiddenOutput
        ? [{ input: hiddenInput, expectedOutput: hiddenOutput, isSample: false, isHidden: true, weight: hiddenWeight }]
        : []),
    ],
    hints: csv(hints),
    editorial: editorial || null,
    assets: [
      ...(figmaLink ? [{ type: 'other', name: 'Figma reference', url: figmaLink }] : []),
      ...csv(referenceLinks).map((url, index) => ({ type: 'other', name: `Reference ${index + 1}`, url })),
    ],
    normalizedRequirements: [
      ...requiredTech.map((content, index) => ({ type: 'technology', content, sortOrder: index })),
      ...csv(requiredFiles).map((content, index) => ({ type: 'file', content, sortOrder: index })),
      ...requiredFeatures.map((content, index) => ({ type: 'feature', content, sortOrder: index })),
      ...(acceptanceCriteria ? [{ type: 'acceptance_criteria', content: acceptanceCriteria }] : []),
      ...(isBackendType ? [{ type: 'api', content: 'Define required endpoints, request/response bodies, authentication rules, validation rules, and business logic.' }] : []),
      ...(isSqlType ? [{ type: 'database', content: 'Provide database schema, sample data, expected query, and hidden validation queries.' }] : []),
      ...(isMcqType ? [{ type: 'rubric', content: 'Provide options, correct answer, and explanation.' }] : []),
      ...(isSystemDesignType ? [{ type: 'rubric', content: 'Provide requirements, constraints, expected components, and evaluation rubric.' }] : []),
    ],
    aiReviewRules: aiCriteria.map((criterion) => ({ criterion, enabled: true, weight: 1 })),
    supportedFrameworks: requiredTech,
    referenceDesigns: figmaLink ? [{ type: 'figma', figmaUrl: figmaLink, description: 'Reference design' }] : [],
  });

  const validateDraftBeforeSubmit = (): string | null => {
    if (!title.trim()) {
      setStep(1);
      return 'Please fill Step 1 → Title before saving the draft.';
    }

    if (!description.trim() || description.trim().length < 10) {
      setStep(2);
      return 'Please fill Step 2 → Problem Statement with at least 10 characters.';
    }

    const codeOptionalTypes: ProblemType[] = ['mcq', 'system-design'];
    if (!codeOptionalTypes.includes(type) && supportedLanguages.length === 0) {
      setStep(3);
      return 'Please select at least one supported language in Step 3.';
    }

    return null;
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const clientError = validateDraftBeforeSubmit();
    if (clientError) {
      setError(clientError);
      setIsSubmitting(false);
      addToast('error', 'Missing Required Field', clientError);
      return;
    }

    try {
      const res = await fetch('/api/v1/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(buildPayload()),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const validationDetails = Array.isArray(json?.errors)
          ? json.errors
              .map((item: any) => `${item.path || item.field || 'field'}: ${item.message || item.code || 'invalid'}`)
              .join(' | ')
          : '';
        throw new Error(
          validationDetails
            ? `${json?.message || 'Question creation failed.'} ${validationDetails}`
            : json?.message || 'Question creation failed.',
        );
      }

      addToast('success', 'Question Saved as Draft', 'It is now listed in Teacher Drafts below. Publish it when ready for students.');
      setTitle('');
      setDescription('');
      setSampleInput('');
      setSampleOutput('');
      setHiddenInput('');
      setHiddenOutput('');
      await fetchDrafts();
    } catch (err: any) {
      setError(err.message || 'Question creation failed.');
      addToast('error', 'Question Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const publishDraft = async (questionId: string) => {
    const res = await fetch(`/api/v1/questions/${questionId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ status: 'published' }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      addToast('error', 'Publish Failed', json?.message || 'Unable to publish this draft.');
      return;
    }
    addToast('success', 'Question Published', 'Students can now see this question in the Question Bank.');
    await fetchDrafts();
  };

  if (!hasSelectedType) {
    return (
      <div className="space-y-8 pb-12">
        <div className="pb-6 border-b border-slate-800">
          <Badge variant="indigo" icon={<Code2 className="w-3.5 h-3.5" />}>Create Question</Badge>
          <h1 className="text-2xl font-black text-slate-100 mt-3">Select Question Type</h1>
          <p className="text-xs text-slate-400 max-w-3xl">
            Choose the assessment type first. The authoring form, evaluation settings, and preview experience are type-specific.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUESTION_TYPES.map((questionType) => (
            <button
              key={questionType.id}
              type="button"
              onClick={() => {
                setType(questionType.id);
                setHasSelectedType(true);
                setStep(1);
              }}
              className="text-left p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-indigo-500/60 hover:bg-indigo-950/20 transition-colors"
            >
              <span className="text-sm font-black text-slate-100 block">{questionType.label}</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Dynamic authoring + deterministic evaluation adapter</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="indigo" icon={<Code2 className="w-3.5 h-3.5" />}>Unified Question Builder</Badge>
          <button
            type="button"
            onClick={() => setHasSelectedType(false)}
            className="text-[11px] font-bold text-cyan-300 hover:underline"
          >
            Change Type
          </button>
        </div>
        <h1 className="text-2xl font-black text-slate-100 mt-3">Create {QUESTION_TYPES.find((item) => item.id === type)?.label} Question</h1>
        <p className="text-xs text-slate-400 max-w-3xl">
          Build reusable questions for practice, homework, contests, assignments, AI challenges, daily challenges, and mock interviews.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStep(item.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${
              step === item.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {item.icon} Step {item.id}: {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSaveDraft} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-6 space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">Step 1 — Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Title">
                  <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Two Sum Variant" />
                </Field>
                <Field label="Slug Auto Generated">
                  <input value={generatedSlug} readOnly className="input opacity-70" />
                </Field>
                <Field label="Question Type">
                  <select value={type} onChange={(e) => setType(e.target.value as ProblemType)} className="input">
                    {QUESTION_TYPES.map((qt) => <option key={qt.id} value={qt.id}>{qt.label}</option>)}
                  </select>
                </Field>
                <Field label="Difficulty">
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="input">
                    {(['Easy', 'Medium', 'Hard', 'Expert'] as const).map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Category"><input value={category} onChange={(e) => setCategory(e.target.value)} className="input" /></Field>
                <Field label="Tags comma separated"><input value={tags} onChange={(e) => setTags(e.target.value)} className="input" placeholder="Array, Hash Set" /></Field>
                <Field label="Topics comma separated"><input value={topics} onChange={(e) => setTopics(e.target.value)} className="input" placeholder="Hashing, Sliding Window" /></Field>
                <Field label="Estimated Time"><input type="number" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} className="input" /></Field>
                <Field label="Maximum Score"><input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} className="input" /></Field>
                <Field label="Visibility">
                  <select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)} className="input">
                    <option value="organization">Organization</option>
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">Step 2 — Problem Statement</h2>
              <Field label="Markdown Problem Statement"><textarea required minLength={10} rows={7} value={description} onChange={(e) => setDescription(e.target.value)} className="input" /></Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Input Format"><textarea rows={3} value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} className="input" /></Field>
                <Field label="Output Format"><textarea rows={3} value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="input" /></Field>
                <Field label="Constraints comma separated"><textarea rows={3} value={constraints} onChange={(e) => setConstraints(e.target.value)} className="input" /></Field>
                <Field label="Notes"><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="input" /></Field>
                <Field label="Hints comma separated"><textarea rows={3} value={hints} onChange={(e) => setHints(e.target.value)} className="input" /></Field>
                <Field label="Reference Links comma separated"><textarea rows={3} value={referenceLinks} onChange={(e) => setReferenceLinks(e.target.value)} className="input" /></Field>
              </div>
              <Field label="Editorial / Official Explanation"><textarea rows={5} value={editorial} onChange={(e) => setEditorial(e.target.value)} className="input" /></Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">Step 3 & 4 — Languages and Starter Code</h2>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button key={lang} type="button" onClick={() => toggleLanguage(lang)} className={`pill ${supportedLanguages.includes(lang) ? 'pillActive' : ''}`}>{lang}</button>
                ))}
              </div>
              {supportedLanguages.map((lang) => (
                <Field key={lang} label={`${lang} starter code`}>
                  <textarea rows={7} value={starterCode[lang] ?? ''} onChange={(e) => setStarterCode((prev) => ({ ...prev, [lang]: e.target.value }))} className="input font-mono" />
                </Field>
              ))}
              {isFrontendType && (
                <Card className="p-4 space-y-3 border-cyan-500/30">
                  <h3 className="text-sm font-bold text-cyan-300 flex gap-2"><UploadCloud className="w-4 h-4" /> Frontend / React / HTML / CSS Requirements</h3>
                  <Selector label="Required Technologies" values={FRONTEND_TECH} selected={requiredTech} onToggle={(v) => toggle(v, requiredTech, setRequiredTech)} />
                  <Selector label="Required Features" values={REQUIRED_FEATURES} selected={requiredFeatures} onToggle={(v) => toggle(v, requiredFeatures, setRequiredFeatures)} />
                  <Field label="Required files comma separated"><input value={requiredFiles} onChange={(e) => setRequiredFiles(e.target.value)} className="input" /></Field>
                  <Field label="Functional / UI acceptance criteria"><textarea rows={3} value={acceptanceCriteria} onChange={(e) => setAcceptanceCriteria(e.target.value)} className="input" /></Field>
                  <Field label="Figma / Reference Design Link"><input value={figmaLink} onChange={(e) => setFigmaLink(e.target.value)} className="input" /></Field>
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-[11px] text-cyan-100">
                    Live browser preview is available for this question type in the student workspace and authoring flow.
                  </div>
                </Card>
              )}

              {isSqlType && (
                <Card className="p-4 space-y-3 border-emerald-500/30">
                  <h3 className="text-sm font-bold text-emerald-300">SQL Evaluation Configuration</h3>
                  <Field label="Database schema / tables"><textarea rows={4} value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} className="input font-mono" placeholder="employees(id INT PK, name TEXT, salary INT)" /></Field>
                  <Field label="Expected result / output"><textarea rows={3} value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="input font-mono" placeholder="name | salary" /></Field>
                  <p className="text-[11px] text-slate-400">SQL evaluation compares normalized result sets, never raw query strings.</p>
                </Card>
              )}

              {isBackendType && (
                <Card className="p-4 space-y-3 border-amber-500/30">
                  <h3 className="text-sm font-bold text-amber-300">Backend / API Evaluation Configuration</h3>
                  <Field label="Required endpoints / request-response contract"><textarea rows={5} value={acceptanceCriteria} onChange={(e) => setAcceptanceCriteria(e.target.value)} className="input" placeholder="POST /api/tasks -> 201, GET /api/tasks -> 200" /></Field>
                  <p className="text-[11px] text-slate-400">Backend evaluation is designed for isolated workers that start the submitted server and run HTTP/API tests.</p>
                </Card>
              )}

              {isDebuggingType && (
                <Card className="p-4 space-y-3 border-rose-500/30">
                  <h3 className="text-sm font-bold text-rose-300">Debugging Configuration</h3>
                  <Field label="Buggy starter code"><textarea rows={7} value={starterCode[supportedLanguages[0] ?? 'javascript'] ?? ''} onChange={(e) => setStarterCode((prev) => ({ ...prev, [supportedLanguages[0] ?? 'javascript']: e.target.value }))} className="input font-mono" /></Field>
                  <Field label="Expected behavior"><textarea rows={3} value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="input" /></Field>
                </Card>
              )}

              {isMcqType && (
                <Card className="p-4 space-y-3 border-purple-500/30">
                  <h3 className="text-sm font-bold text-purple-300">MCQ / Theory Configuration</h3>
                  <Field label="Options comma separated"><textarea rows={3} value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} className="input" placeholder="A. Closure, B. Loop, C. Object method" /></Field>
                  <Field label="Correct answer(s) for private evaluation"><input value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="input" placeholder="A" /></Field>
                  <p className="text-[11px] text-slate-400">Correct answers are stored in private evaluation config and are not returned to students.</p>
                </Card>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">Step 5 — Test Cases</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4 space-y-3 border-emerald-500/30">
                  <h3 className="text-sm font-bold text-emerald-300">Sample Test Case — visible to students</h3>
                  <Field label="Input"><textarea rows={4} value={sampleInput} onChange={(e) => setSampleInput(e.target.value)} className="input" /></Field>
                  <Field label="Output"><textarea rows={3} value={sampleOutput} onChange={(e) => setSampleOutput(e.target.value)} className="input" /></Field>
                  <Field label="Explanation"><textarea rows={2} value={sampleExplanation} onChange={(e) => setSampleExplanation(e.target.value)} className="input" /></Field>
                </Card>
                <Card className="p-4 space-y-3 border-rose-500/30">
                  <h3 className="text-sm font-bold text-rose-300">Hidden Test Case — evaluator only</h3>
                  <Field label="Input"><textarea rows={4} value={hiddenInput} onChange={(e) => setHiddenInput(e.target.value)} className="input" /></Field>
                  <Field label="Expected Output"><textarea rows={3} value={hiddenOutput} onChange={(e) => setHiddenOutput(e.target.value)} className="input" /></Field>
                  <Field label="Weight"><input type="number" value={hiddenWeight} onChange={(e) => setHiddenWeight(Number(e.target.value))} className="input" /></Field>
                </Card>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">Step 6 — Execution, AI, Plagiarism, Submission and Scoring</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Time Limit MS"><input type="number" value={timeLimitMs} onChange={(e) => setTimeLimitMs(Number(e.target.value))} className="input" /></Field>
                <Field label="Memory Limit MB"><input type="number" value={memoryLimitMb} onChange={(e) => setMemoryLimitMb(Number(e.target.value))} className="input" /></Field>
                <Field label="Maximum Code Size KB"><input type="number" value={maxCodeSizeKb} onChange={(e) => setMaxCodeSizeKb(Number(e.target.value))} className="input" /></Field>
                <Field label="Execution Timeout MS"><input type="number" value={executionTimeoutMs} onChange={(e) => setExecutionTimeoutMs(Number(e.target.value))} className="input" /></Field>
                <Field label="Max Attempts blank = unlimited"><input value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} className="input" /></Field>
                <Field label="Similarity Threshold"><input type="number" value={similarityThreshold} onChange={(e) => setSimilarityThreshold(Number(e.target.value))} className="input" /></Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={plagiarismEnabled} onChange={(e) => setPlagiarismEnabled(e.target.checked)} /> Enable plagiarism detection</label>
              <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={allowLateSubmission} onChange={(e) => setAllowLateSubmission(e.target.checked)} /> Allow late submission</label>
              <Selector label="AI Review Criteria" values={AI_CRITERIA} selected={aiCriteria} onToggle={(v) => toggle(v, aiCriteria, setAiCriteria)} />
            </div>
          )}

          {error && <div className="flex gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3"><AlertCircle className="w-4 h-4" /> {error}</div>}

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</Button>
            <div className="flex gap-2">
              {step < 5 && <Button type="button" variant="primary" onClick={() => setStep((s) => Math.min(5, s + 1))}>Next</Button>}
              <Button type="submit" variant="glow" icon={<Plus className="w-4 h-4" />} isLoading={isSubmitting}>Save Question Draft</Button>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4 h-fit sticky top-24">
          <h3 className="text-sm font-black text-white">Teacher Drafts</h3>
          <p className="text-[11px] text-slate-400">Draft questions are visible here. Publish to make them visible in the Student Question Bank.</p>
          {loadingDrafts ? <p className="text-xs text-slate-500">Loading drafts...</p> : drafts.length === 0 ? (
            <p className="text-xs text-slate-500">No draft questions yet.</p>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {drafts.map((draft) => (
                <div key={draft.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{draft.title}</p>
                      <p className="text-[10px] text-slate-500">{draft.type} · {draft.difficulty} · {draft.category}</p>
                    </div>
                    <Badge variant="amber">DRAFT</Badge>
                  </div>
                  <Button size="sm" variant="primary" className="w-full" onClick={() => publishDraft(draft.id)}>Publish to Students</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </form>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
    {children}
  </label>
);

const Selector: React.FC<{ label: string; values: string[]; selected: string[]; onToggle: (value: string) => void }> = ({ label, values, selected, onToggle }) => (
  <div className="space-y-2">
    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <button key={value} type="button" onClick={() => onToggle(value)} className={`pill ${selected.includes(value) ? 'pillActive' : ''}`}>{value}</button>
      ))}
    </div>
  </div>
);
