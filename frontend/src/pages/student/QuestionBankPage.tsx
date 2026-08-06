import React, { useEffect, useMemo, useState } from 'react';
import { Search, Bookmark, Code2, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { QuestionCard } from '../../components/domain/QuestionCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Difficulty, Question } from '../../types';

interface EditQuestionForm {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  description: string;
  tags: string;
  status: 'draft' | 'published' | 'archived';
}

const csv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const QuestionBankPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const canManage = currentUser?.role === 'mentor' || currentUser?.role === 'admin';

  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>(canManage ? 'All' : 'published');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState<EditQuestionForm | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [error, setError] = useState('');

  const companies = ['All', 'Google', 'Amazon', 'Meta', 'Microsoft', 'Linear', 'Vercel'];

  const authHeaders = (): HeadersInit => {
    const token = localStorage.getItem('devbattles.token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      if (!canManage) params.set('status', 'published');
      if (search) params.set('search', search);
      if (selectedDifficulty !== 'All') params.set('difficulty', selectedDifficulty);
      if (onlyBookmarked) params.set('bookmarked', 'true');

      const res = await fetch(`/api/v1/questions?${params.toString()}`, { headers: authHeaders() });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Failed to load questions.');
      }
      setQuestionsList(Array.isArray(json.data?.items) ? json.data.items : []);
    } catch (err: any) {
      console.error('Error fetching questions from API:', err);
      addToast('error', 'Question Bank Failed', err.message || 'Unable to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, selectedDifficulty, selectedStatus, onlyBookmarked, canManage]);

  const displayedQuestions = useMemo(
    () =>
      questionsList.filter((q) => {
        if (selectedCompany !== 'All' && !q.companies?.includes(selectedCompany)) return false;
        return true;
      }),
    [questionsList, selectedCompany],
  );

  const openEdit = (question: Question) => {
    setError('');
    setEditForm({
      id: question.id,
      title: question.title,
      difficulty: question.difficulty,
      category: question.category,
      description: question.description,
      tags: question.tags?.join(', ') ?? '',
      status: question.status ?? 'draft',
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    if (!editForm.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!editForm.description.trim() || editForm.description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }

    setIsSavingEdit(true);
    setError('');
    try {
      const current = questionsList.find((q) => q.id === editForm.id);
      const updateRes = await fetch(`/api/v1/questions/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          title: editForm.title.trim(),
          difficulty: editForm.difficulty,
          category: editForm.category.trim() || 'General',
          description: editForm.description.trim(),
          tags: csv(editForm.tags),
        }),
      });
      const updateJson = await updateRes.json().catch(() => null);
      if (!updateRes.ok || !updateJson?.success) {
        throw new Error(updateJson?.message || 'Failed to update question.');
      }

      if (current?.status !== editForm.status) {
        const statusRes = await fetch(`/api/v1/questions/${editForm.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ status: editForm.status }),
        });
        const statusJson = await statusRes.json().catch(() => null);
        if (!statusRes.ok || !statusJson?.success) {
          throw new Error(statusJson?.message || 'Question updated, but status change failed.');
        }
      }

      addToast('success', 'Question Updated', 'Teacher changes have been saved.');
      setEditForm(null);
      await fetchQuestions();
    } catch (err: any) {
      setError(err.message || 'Failed to update question.');
      addToast('error', 'Update Failed', err.message || 'Failed to update question.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (question: Question) => {
    if (!window.confirm(`Delete "${question.title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/v1/questions/${question.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Failed to delete question.');
      }
      setQuestionsList((prev) => prev.filter((item) => item.id !== question.id));
      addToast('success', 'Question Deleted', `"${question.title}" was removed.`);
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Failed to delete question.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Code2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-100">
              {canManage ? 'Teacher Question Bank' : 'Algorithmic & Frontend Question Bank'}
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            {canManage
              ? 'View, edit, publish/archive, or delete reusable questions for practice, homework, contests, and assignments.'
              : 'Practice production-grade DSA problems, system designs, and frontend challenges.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyBookmarked(!onlyBookmarked)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              onlyBookmarked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> Bookmarks Only
          </button>
        </div>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, tag, category or algorithm..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['All', 'Easy', 'Medium', 'Hard', 'Expert'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-500 font-semibold shrink-0">Status:</span>
            {['All', 'draft', 'published', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-2.5 py-1 rounded-md transition-colors shrink-0 capitalize ${
                  selectedStatus === status
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/60 text-xs">
          <span className="text-slate-500 font-semibold shrink-0">Company Tags:</span>
          {companies.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCompany(c)}
              className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                selectedCompany === c
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs">Loading coding challenges from Question Service...</span>
        </div>
      ) : displayedQuestions.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          No matching problems found. Try clearing filters or creating a question draft.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedQuestions.map((question) => (
<div key={question.id} className="space-y-2">
              {canManage && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2">
                  <Badge variant={question.status === 'published' ? 'emerald' : question.status === 'archived' ? 'neutral' : 'amber'}>
                    {(question.status ?? 'draft').toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(question)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => handleDelete(question)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )}
              <QuestionCard
                question={question}
                onBookmarkChange={(questionId, bookmarked) =>
                  setQuestionsList((prev) =>
                    prev
                      .map((item) => (item.id === questionId ? { ...item, isBookmarked: bookmarked } : item))
                      .filter((item) => (onlyBookmarked ? item.isBookmarked : true)),
                  )
                }
              />
            </div>
          ))}
        </div>
      )}

      {editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <Card className="w-full max-w-2xl p-6 space-y-4 border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Edit Question</h2>
                <p className="text-xs text-slate-400">Teachers can update question metadata or publish/archive from here.</p>
              </div>
              <button onClick={() => setEditForm(null)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1 md:col-span-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Title</span>
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="input" />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Difficulty</span>
                <select value={editForm.difficulty} onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value as Difficulty })} className="input">
                  {(['Easy', 'Medium', 'Hard', 'Expert'] as const).map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as EditQuestionForm['status'] })} className="input">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Category</span>
                <input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="input" />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tags comma separated</span>
                <input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} className="input" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</span>
                <textarea rows={6} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="input" />
              </label>
            </div>

            {error && <div className="text-xs text-rose-300 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">{error}</div>}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setEditForm(null)}>Cancel</Button>
              <Button variant="glow" isLoading={isSavingEdit} onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
