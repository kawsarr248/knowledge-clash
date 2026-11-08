import React, { useState, useEffect, useCallback } from 'react';
import { Quiz } from '../types/quiz';
import { MathRenderer } from './MathRenderer';
import { formatDuration } from '../utils/quizLogic';
import {
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  X,
  ListFilter,
} from 'lucide-react';

interface QuizPlayerProps {
  quiz: Quiz;
  onComplete: (userAnswers: Record<string, number | null>, timeSpentSeconds: number) => void;
  onExit: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  onComplete,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.timeLimitMinutes > 0 ? quiz.timeLimitMinutes * 60 : null
  );
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Finish function
  const handleFinalSubmit = useCallback(() => {
    onComplete(answers, timeSpent);
  }, [answers, onComplete, timeSpent]);

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);

      if (timeLeft !== null) {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            handleFinalSubmit();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleFinalSubmit]);

  // Keyboard navigation & shortcuts (1-4 or A-D for options, Arrow keys for next/prev)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if modal is open
      if (showConfirmSubmit || showConfirmExit) return;

      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      } else if (['1', 'a', 'A'].includes(e.key)) {
        handleSelectOption(0);
      } else if (['2', 'b', 'B'].includes(e.key)) {
        handleSelectOption(1);
      } else if (['3', 'c', 'C'].includes(e.key)) {
        handleSelectOption(2);
      } else if (['4', 'd', 'D'].includes(e.key)) {
        handleSelectOption(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions.length, showConfirmSubmit, showConfirmExit, currentQuestion]);

  const handleSelectOption = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Top Test Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfirmExit(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
              <MathRenderer content={quiz.title} />
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">
                {answeredCount} answered
              </span>
            </div>
          </div>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-2">
          {timeLeft !== null ? (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-sm font-bold ${
                timeLeft < 60
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-slate-800 text-amber-300 border-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatDuration(timeLeft)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDuration(timeSpent)}</span>
            </div>
          )}

          <button
            onClick={() => setShowNavigator(!showNavigator)}
            className={`p-2 rounded-xl border text-xs font-medium transition-all ${
              showNavigator
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
            title="Question Navigator"
          >
            <ListFilter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Navigator Grid Dropdown */}
      {showNavigator && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
            <span className="font-semibold text-white">Jump to Question</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-indigo-600" /> Answered
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Flagged
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-slate-800" /> Pending
              </span>
            </div>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((q, idx) => {
              const isAns = answers[q.id] !== undefined && answers[q.id] !== null;
              const isFlg = flagged[q.id];
              const isCurr = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowNavigator(false);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all relative ${
                    isCurr
                      ? 'ring-2 ring-indigo-400 bg-indigo-600/40 text-white'
                      : isAns
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  {idx + 1}
                  {isFlg && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Question Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
              Q{currentIndex + 1}
            </span>
            <span className="text-xs text-slate-400">Single Choice</span>
          </div>

          <button
            onClick={toggleFlag}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
              flagged[currentQuestion.id]
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${flagged[currentQuestion.id] ? 'fill-current' : ''}`} />
            <span>{flagged[currentQuestion.id] ? 'Flagged' : 'Flag for review'}</span>
          </button>
        </div>

        {/* Prompt */}
        <div className="my-6">
          <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed tracking-normal">
            <MathRenderer content={currentQuestion.prompt} />
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, optIdx) => {
            const isSelected = answers[currentQuestion.id] === optIdx;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 group ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 group-hover:text-white'
                  }`}
                >
                  {optionLetters[optIdx]}
                </span>
                <span className="flex-1 text-sm sm:text-base pt-0.5 leading-relaxed font-normal">
                  <MathRenderer content={option} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer Controls */}
      <div className="flex items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="text-xs text-slate-400 font-medium">
          {currentIndex + 1} / {questions.length}
        </div>

        {isLastQuestion ? (
          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Finish & Submit</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ready to submit?</h3>
              <p className="text-xs text-slate-400 mt-1">
                You answered{' '}
                <strong className="text-white">{answeredCount}</strong> out of{' '}
                <strong className="text-white">{questions.length}</strong> questions.
                {questions.length - answeredCount > 0 && (
                  <span className="block mt-1 text-amber-400 font-semibold">
                    Warning: {questions.length - answeredCount} unanswered question(s)!
                  </span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Keep Testing
              </button>
              <button
                onClick={handleFinalSubmit}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showConfirmExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Leave this quiz?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your current test progress will be lost.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Stay Here
              </button>
              <button
                onClick={onExit}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Exit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
