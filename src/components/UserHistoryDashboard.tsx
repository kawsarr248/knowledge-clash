import React, { useEffect, useState } from 'react';
import { QuizAttempt, Quiz } from '../types/quiz';
import { getUserAttempts } from '../services/quizService';
import { formatDuration } from '../utils/quizLogic';
import { MathRenderer } from './MathRenderer';
import { useAuth } from '../context/AuthContext';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  BookOpen,
  Award,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface UserHistoryDashboardProps {
  quizzes: Quiz[];
  onReviewAttempt: (attempt: QuizAttempt, quiz: Quiz) => void;
  onRetakeQuiz: (quiz: Quiz) => void;
  onExplore: () => void;
}

export const UserHistoryDashboard: React.FC<UserHistoryDashboardProps> = ({
  quizzes,
  onReviewAttempt,
  onRetakeQuiz,
  onExplore,
}) => {
  const { effectiveUserId, effectiveUserName } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserAttempts(effectiveUserId)
      .then((data) => setAttempts(data))
      .catch((e) => console.error('History load error', e))
      .finally(() => setLoading(false));
  }, [effectiveUserId]);

  const totalQuizzes = attempts.length;
  const totalScore = attempts.reduce((acc, a) => acc + a.score, 0);
  const totalQuestions = attempts.reduce((acc, a) => acc + a.totalQuestions, 0);
  const totalWrong = attempts.reduce((acc, a) => acc + a.wrongAnswersCount, 0);
  const overallAccuracy =
    totalQuestions > 0 ? Math.round(((totalQuestions - totalWrong) / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Score Tracking & Mistake Review</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              {effectiveUserName}'s Test Performance
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Analyze your past quiz attempts, review every mistake, and reinforce key concepts.
            </p>
          </div>

          <button
            onClick={onExplore}
            className="self-start sm:self-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <span>Take More Quizzes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="block text-2xl font-black text-white">{totalQuizzes}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Tests Taken
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="block text-2xl font-black text-indigo-400">{totalScore}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Points Scored
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="block text-2xl font-black text-emerald-400">
              {overallAccuracy}%
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Avg. Accuracy
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="block text-2xl font-black text-rose-400">{totalWrong}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Mistakes Tracked
            </span>
          </div>
        </div>
      </div>

      {/* Attempts History List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Completed Quiz Attempts ({attempts.length})</span>
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
            Loading your score records...
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 p-8">
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No attempts recorded yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Take your first quiz from the arena to track your scores and wrong answers!
            </p>
            <button
              onClick={onExplore}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Start First Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt) => {
              const matchedQuiz = quizzes.find((q) => q.id === attempt.quizId);
              const dateStr = new Date(attempt.completedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={attempt.id}
                  className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {formatDuration(attempt.timeSpentSeconds)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">
                      <MathRenderer content={attempt.quizTitle} />
                    </h3>

                    {/* Wrong answers badge indicator */}
                    <div className="flex items-center gap-3 pt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        {attempt.score}/{attempt.totalQuestions} ({attempt.percentage}%)
                      </span>

                      {attempt.wrongAnswersCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          {attempt.wrongAnswersCount} Wrong Answers
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          🌟 100% Perfect
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {matchedQuiz && (
                      <button
                        onClick={() => onReviewAttempt(attempt, matchedQuiz)}
                        className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Review Mistakes</span>
                      </button>
                    )}

                    {matchedQuiz && (
                      <button
                        onClick={() => onRetakeQuiz(matchedQuiz)}
                        className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs transition-colors"
                        title="Retake Quiz"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
