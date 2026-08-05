import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Bookmark, CheckCircle2, Clock, Code2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Question } from '../../types';
import { apiFetch } from '../../utils/api';
import { Card } from '../ui/Card';
import { Badge, DifficultyBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface QuestionCardProps {
  question: Question;
  onBookmarkChange?: (questionId: string, bookmarked: boolean) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onBookmarkChange }) => {
  const navigate = useNavigate();
  const [isBookmarking, setIsBookmarking] = useState(false);
  const isBookmarked = Boolean(question.isBookmarked);

  const handleBookmark = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isBookmarking) return;

    setIsBookmarking(true);
    try {
      await apiFetch<{ bookmarked: boolean }>(`/api/v1/questions/${question.id}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
      });
      onBookmarkChange?.(question.id, !isBookmarked);
    } catch (err) {
      console.error('Failed to update bookmark:', err);
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <Card hoverElevate glow className="flex flex-col justify-between h-full group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-slate-800 text-indigo-400 group-hover:bg-indigo-600/20 transition-colors">
              <Code2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition-colors light:text-slate-900">
                {question.title}
              </h3>
              <p className="text-xs text-slate-400">{question.category}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleBookmark}
            disabled={isBookmarking}
            className="text-slate-500 hover:text-amber-400 transition-colors p-1 disabled:opacity-50"
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed light:text-slate-600">
          {question.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <DifficultyBadge difficulty={question.difficulty} />
          {question.technology.slice(0, 3).map((tech) => (
            <Badge key={tech} variant="neutral" size="sm">
              {tech}
            </Badge>
          ))}
          {question.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="indigo" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 light:border-slate-200">
        <div className="flex items-center gap-3">
          <span title="Acceptance Rate" className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {question.acceptanceRate}%
          </span>
          <span title="Estimated Time" className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {question.estimatedMinutes}m
          </span>
        </div>

        <Button
          size="sm"
          variant={question.solvedStatus === 'solved' ? 'secondary' : 'primary'}
          icon={<ArrowUpRight className="w-3.5 h-3.5" />}
          iconPosition="right"
          onClick={() => navigate(`/workspace/${question.id}`)}
        >
          {question.solvedStatus === 'solved' ? 'Re-Solve' : 'Solve'}
        </Button>
      </div>
    </Card>
  );
};
