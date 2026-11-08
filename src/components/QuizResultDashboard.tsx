import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, QuestionAnalysis } from '../types/quiz';
import { QuizScoreSummary, formatDuration } from '../utils/quizLogic';
import { MathRenderer } from './MathRenderer';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  Share2,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface QuizResultDashboardProps {
  quiz: Quiz;
  summary: QuizScoreSummary;
  timeSpentSeconds: number;
  onRetakeAll: () => void;
  onRetakeMistakesOnly?: (mistakes: QuestionAnalysis[]) => void;
  onViewLeaderboard: () => void;
  onExploreMore: () => void;
  onShareScore: () => void;
}

export const QuizResultDashboard: React.FC<QuizResultDashboardProps> = ({
  quiz,
  summary,
  timeSpentSeconds,
  onRetakeAll,
  onRetakeMistakesOnly,
  onViewLeaderboard,
  onExploreMore,
  onShareScore,
}) => {
  const [filterMode, setFilterMode] = useState<'wrong' | 'all' | 'correct'>('wrong');

  useEffect(() => {
    // Fire celebratory confetti if high score
    if (summary.scorePercentage >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#10b981'],
        });
      } catch (e) {
        console.warn('Confetti error', e);
      }
    }
  }, [summary.scorePercentage]);

  const displayedQuestions =
    filterMode === 'wrong'
      ? summary.wrongAnswersOnly
      : filterMode === 'correct'
      ? summary.questionsAnalysis.filter((q) => q.isCorrect)
      : summary.questionsAnalysis;

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Score Summary Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/60 to-purple-950/60 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Grade Dial */}
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex flex-col items-center justify-center text-white shadow-xl shadow-indigo-600/30 ring-4 ring-indigo-500/20 shrink-0">
              <span className="text-3xl font-black">{summary.scorePercentage}%</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                Grade {summary.grade}
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quiz Complete</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white line-clamp-1">
                <MathRenderer content={quiz.title} />
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {summary.feedbackText}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center min-w-[80px]">
              <div className="flex items-center justify-center text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="block text-lg font-bold text-white">
                {summary.correctCount}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Correct
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center min-w-[80px]">
              <div className="flex items-center justify-center text-rose-400 mb-1">
                <XCircle className="w-4 h-4" />
              </div>
              <span className="block text-lg font-bold text-white">
                {summary.wrongCount + summary.skippedCount}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Wrong
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center min-w-[80px]">
              <div className="flex items-center justify-center text-amber-400 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <span className="block text-lg font-bold text-white">
                {formatDuration(timeSpentSeconds)}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Time
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onRetakeAll}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>

            {summary.wrongAnswersOnly.length > 0 && onRetakeMistakesOnly && (
              <button
                onClick={() => onRetakeMistakesOnly(summary.wrongAnswersOnly)}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Practice Mistakes ({summary.wrongAnswersOnly.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onViewLeaderboard}
              className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={onShareScore}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Score</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mistake & Detailed Analysis Section Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>Wrong Answers & Detailed Solutions</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review your answers, see correct responses, and understand step-by-step mathematical reasoning.
            </p>
          </div>

          {/* Review Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setFilterMode('wrong')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterMode === 'wrong'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Wrong Answers ({summary.wrongCount + summary.skippedCount})</span>
            </button>

            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({summary.totalQuestions})
            </button>

            <button
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterMode === 'correct'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Correct ({summary.correctCount})</span>
            </button>
          </div>
        </div>

        {/* Detailed Questions List */}
        {displayedQuestions.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white">No questions in this filter</h3>
            <p className="text-xs text-slate-400 mt-1">
              {filterMode === 'wrong'
                ? 'Outstanding! You had zero wrong answers in this quiz.'
                : 'No items found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedQuestions.map((item, idx) => {
              const isWrong = !item.isCorrect;
              const wasSkipped = item.selectedOptionIndex === null;

              return (
                <div
                  key={item.questionId}
                  className={`bg-slate-900/90 rounded-2xl border p-5 sm:p-6 transition-all shadow-md ${
                    isWrong
                      ? 'border-rose-500/30 ring-1 ring-rose-500/10'
                      : 'border-emerald-500/30 ring-1 ring-emerald-500/10'
                  }`}
                >
                  {/* Status header */}
                  <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </span>
                      {isWrong ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          {wasSkipped ? 'Skipped / Unanswered' : 'Incorrect Answer'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Correct Answer
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-base font-bold text-white mb-4 leading-relaxed">
                    <MathRenderer content={item.prompt} />
                  </div>

                  {/* 4 Choices Grid with Clear Indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                    {item.options.map((opt, optIdx) => {
                      const isUserChoice = item.selectedOptionIndex === optIdx;
                      const isCorrectChoice = item.correctOptionIndex === optIdx;

                      let cardStyle = 'bg-slate-950/60 border-slate-800 text-slate-400';
                      let badge = null;

                      if (isCorrectChoice) {
                        cardStyle =
                          'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold ring-1 ring-emerald-500/30';
                        badge = (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 shrink-0">
                            ✓ Correct Option
                          </span>
                        );
                      } else if (isUserChoice && !isCorrectChoice) {
                        cardStyle =
                          'bg-rose-500/15 border-rose-500/50 text-rose-200 font-semibold ring-1 ring-rose-500/30';
                        badge = (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/40 shrink-0">
                            ✕ Your Choice
                          </span>
                        );
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start justify-between gap-2 transition-all ${cardStyle}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                              {optionLetters[optIdx]}
                            </span>
                            <span className="leading-relaxed pt-0.5">
                              <MathRenderer content={opt} />
                            </span>
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation / Solution Box */}
                  <div className="bg-slate-950/80 rounded-xl p-3.5 border border-indigo-500/20">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                      💡 Step-by-Step Solution & Explanation:
                    </span>
                    <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      <MathRenderer content={item.explanation} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between pt-4 pb-8">
        <button
          onClick={onExploreMore}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl transition-all"
        >
          Explore More Quizzes
        </button>
        <button
          onClick={onViewLeaderboard}
          className="flex items-center gap-1 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 active:scale-95 transition-all"
        >
          <span>See Standings on Leaderboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
