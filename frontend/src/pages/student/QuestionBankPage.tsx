import React, { useState, useEffect } from 'react';
import { Search, Bookmark, Code2, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { QuestionCard } from '../../components/domain/QuestionCard';
import { Question } from '../../types';

export const QuestionBankPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const companies = ['All', 'Google', 'Amazon', 'Meta', 'Microsoft', 'Linear', 'Vercel'];

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        let url = `/api/v1/questions?status=published&limit=100`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (selectedDifficulty !== 'All') url += `&difficulty=${selectedDifficulty}`;
        if (onlyBookmarked) url += `&bookmarked=true`;
        
        const token = localStorage.getItem('devbattles.token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(url, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && Array.isArray(json.data.items)) {
            setQuestionsList(json.data.items);
          }
        }
      } catch (err) {
        console.error('Error fetching questions from API:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchQuestions();
    }, 300); // debounce input

    return () => clearTimeout(timer);
  }, [search, selectedDifficulty, onlyBookmarked]);

  const displayedQuestions = questionsList.filter((q) => {
    if (selectedCompany !== 'All' && !q.companies?.includes(selectedCompany)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Code2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-100">Algorithmic & Frontend Question Bank</h1>
          </div>
          <p className="text-xs text-slate-400">
            Practice production-grade DSA problems, system designs, and frontend challenges.
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

      {/* FILTER CONTROLS BAR */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, tag, category or algorithm (e.g. Two Sum, Hash Map)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
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

        {/* Company Tags Bar */}
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

      {/* QUESTION GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs">Loading coding challenges from Question Service...</span>
        </div>
      ) : displayedQuestions.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          No matching problems found. Try clearing filters or searching for "Two Sum".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onBookmarkChange={(questionId, bookmarked) =>
                setQuestionsList((prev) =>
                  prev
                    .map((item) => (item.id === questionId ? { ...item, isBookmarked: bookmarked } : item))
                    .filter((item) => (onlyBookmarked ? item.isBookmarked : true)),
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
