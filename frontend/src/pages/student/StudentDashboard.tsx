import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code2,
  BookOpen,
  Trophy,
  Flame,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  Cpu,
  CheckCircle2,
  Play,
  Award,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { QuestionCard } from '../../components/domain/QuestionCard';
import { HomeworkCard } from '../../components/domain/HomeworkCard';
import { ContestCard } from '../../components/domain/ContestCard';
import { mockHomework, mockContests, mockSubmissions } from '../../data/mockData';
import { Question } from '../../types';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [recommendedQuestion, setRecommendedQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const loadRecommendedQuestion = async () => {
      try {
        const token = localStorage.getItem('devbattles.token');
        const res = await fetch('/api/v1/questions?limit=1', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success && Array.isArray(json.data?.items)) {
          setRecommendedQuestion(json.data.items[0] ?? null);
        }
      } catch (err) {
        console.error('Failed to load recommended question:', err);
      }
    };

    loadRecommendedQuestion();
  }, []);

  if (!currentUser) return null;

  /** Freshly approved accounts have no history yet - avoid showing fake progress copy. */
  const isNewUser = currentUser.problemsSolved === 0;
  const firstName = currentUser.name.split(' ')[0];

  const activityData = [
    { day: 'Mon', solved: 4, xp: 240 },
    { day: 'Tue', solved: 6, xp: 380 },
    { day: 'Wed', solved: 3, xp: 190 },
    { day: 'Thu', solved: 8, xp: 520 },
    { day: 'Fri', solved: 5, xp: 310 },
    { day: 'Sat', solved: 10, xp: 680 },
    { day: 'Sun', solved: 7, xp: 450 },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* WELCOME BANNER */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                {currentUser.collegeName || 'DevBattles Arena'}
              </span>
              {currentUser.batchName && <span className="text-xs text-slate-400">· {currentUser.batchName}</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {isNewUser ? `Welcome to DevBattles, ${firstName}!` : `Welcome back, ${firstName}!`} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {isNewUser ? (
                <>
                  Your account is verified and active. Solve your first problem to start a{' '}
                  <strong className="text-amber-400">daily streak</strong> and climb the batch leaderboard.
                </>
              ) : (
                <>
                  You are currently on a <strong className="text-amber-400">{currentUser.streak}-day daily streak</strong>!
                  You have 1 homework assignment due in 5 days.
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="glow"
              icon={<Play className="w-4 h-4" />}
              onClick={() => navigate(recommendedQuestion ? `/workspace/${recommendedQuestion.id}` : '/questions')}
            >
              Continue Learning
            </Button>
          </div>
        </div>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Problems Solved"
          value={currentUser.problemsSolved}
          icon={<Code2 className="w-5 h-5 text-indigo-400" />}
          trend={isNewUser ? undefined : { value: '+12 this week', isPositive: true }}
          subtitle={isNewUser ? 'Solve your first problem' : 'Top 8% in batch'}
        />
        <StatCard
          title="Current Streak"
          value={`${currentUser.streak} Days`}
          icon={<Flame className="w-5 h-5 text-amber-400" />}
          trend={isNewUser ? undefined : { value: 'Personal Best', isPositive: true }}
          subtitle={isNewUser ? 'Start your streak today' : 'Keep coding daily'}
        />
        <StatCard
          title="Global Arena Rank"
          value={currentUser.rank > 0 ? `#${currentUser.rank}` : 'Unranked'}
          icon={<Trophy className="w-5 h-5 text-cyan-400" />}
          trend={isNewUser ? undefined : { value: 'Up 3 places', isPositive: true }}
          subtitle={isNewUser ? 'Rank unlocks after 1st solve' : 'Among 150k coders'}
        />
        <StatCard
          title="Total Earned XP"
          value={currentUser.xp.toLocaleString()}
          icon={<Zap className="w-5 h-5 text-emerald-400" />}
          trend={isNewUser ? undefined : { value: '+680 XP today', isPositive: true }}
          subtitle={isNewUser ? 'Earn XP with every solve' : 'Level 18 Grandmaster'}
        />
      </div>

      {/* ACTIVITY CHART & UPCOMING CONTEST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Area Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 light:text-slate-900">Weekly Activity & XP Yield</h3>
              <p className="text-xs text-slate-400">Daily solved problems performance</p>
            </div>
            <Badge variant="emerald" icon={<TrendingUp className="w-3 h-3" />}>
              43 Solved This Week
            </Badge>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                  }}
                />
                <Area type="monotone" dataKey="xp" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Live / Upcoming Contest Widget */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 light:text-slate-900">Featured Contest</h3>
            <button
              onClick={() => navigate('/contests')}
              className="text-xs text-indigo-400 font-bold hover:underline"
            >
              View All
            </button>
          </div>
          <ContestCard contest={mockContests[1]} onRegister={() => navigate('/contests')} />
        </div>
      </div>

      {/* HOMEWORK DUE & RECOMMENDED QUESTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-100 light:text-slate-900">Active Batch Homework</h3>
            <button onClick={() => navigate('/homework')} className="text-xs text-indigo-400 font-bold hover:underline">
              View All Homework
            </button>
          </div>
          <HomeworkCard homework={mockHomework[0]} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-100 light:text-slate-900">Recommended for You</h3>
            <button onClick={() => navigate('/questions')} className="text-xs text-indigo-400 font-bold hover:underline">
              Explore Bank
            </button>
          </div>
          {recommendedQuestion ? (
            <QuestionCard question={recommendedQuestion} />
          ) : (
            <Card className="p-6 text-sm text-slate-400">
              No published questions are available yet. Ask a mentor to publish a question draft.
            </Card>
          )}
        </div>
      </div>

      {/* RECENT SUBMISSIONS TABLE SUMMARY */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100 light:text-slate-900">Recent Submissions</h3>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/submissions')}>
            View History
          </Button>
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          {mockSubmissions.map((sub) => (
            <div key={sub.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 light:text-slate-800 block">{sub.questionTitle}</span>
                <span className="text-slate-500">{sub.language} · {new Date(sub.submittedAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={sub.status === 'Accepted' ? 'emerald' : 'rose'}>{sub.status}</Badge>
                <span className="text-slate-400">{sub.runtimeMs}ms</span>
                {sub.aiReview && (
                  <Button size="sm" variant="outline" onClick={() => navigate('/ai-reviews')}>
                    AI Review ({sub.aiReview.overallScore}/100)
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
