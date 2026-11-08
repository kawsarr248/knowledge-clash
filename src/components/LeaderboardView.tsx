import React, { useState, useEffect } from 'react';
import { Quiz, LeaderboardEntry } from '../types/quiz';
import { getQuizLeaderboard } from '../services/quizService';
import { formatDuration } from '../utils/quizLogic';
import { MathRenderer } from './MathRenderer';
import {
  Trophy,
  Medal,
  Clock,
  Flame,
  Play,
  Share2,
  Crown,
  Search,
  Sparkles,
} from 'lucide-react';

interface LeaderboardViewProps {
  quizzes: Quiz[];
  initialQuizId?: string;
  onTakeQuiz: (quiz: Quiz) => void;
  onShareQuiz: (quiz: Quiz) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  quizzes,
  initialQuizId,
  onTakeQuiz,
  onShareQuiz,
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(
    initialQuizId || (quizzes[0]?.id ?? '')
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];

  useEffect(() => {
    if (!selectedQuiz) return;
    setIsLoading(true);
    getQuizLeaderboard(selectedQuiz.id)
      .then((entries) => {
        setLeaderboard(entries);
      })
      .catch((err) => {
        console.error('Failed to load leaderboard', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedQuiz]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-1">
              <Crown className="w-3.5 h-3.5" />
              <span>Competitive Leaderboards</span>
            </div>
            <h1 className="text-2xl font-black text-white">Quiz Champion Standings</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Rankings are scored by accuracy and fastest completion time.
            </p>
          </div>
        </div>

        {/* Quiz selector */}
        <div className="w-full md:w-72">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Select Active Arena:
          </label>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500"
          >
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.language === 'bn' ? 'বাংলা' : q.language.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedQuiz && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <MathRenderer content={selectedQuiz.title} />
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedQuiz.questionsCount} questions • Subject: <span className="text-indigo-400 font-semibold">{selectedQuiz.category || 'General'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onShareQuiz(selectedQuiz)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
            <button
              onClick={() => onTakeQuiz(selectedQuiz)}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Compete Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Podium for Top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          {/* Rank 2 */}
          {top3[1] && (
            <div className="order-2 sm:order-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-center flex flex-col items-center justify-between shadow-lg sm:translate-y-4">
              <div className="w-10 h-10 rounded-full bg-slate-400/20 text-slate-300 flex items-center justify-center font-black text-sm mb-2 border border-slate-400/30">
                2
              </div>
              <div className="font-bold text-white text-sm truncate max-w-full">
                {top3[1].userName}
              </div>
              <div className="mt-2 text-xs font-mono font-bold text-slate-300 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                Score: {top3[1].score} ({top3[1].percentage}%)
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {formatDuration(top3[1].timeSpentSeconds)}
              </div>
            </div>
          )}

          {/* Rank 1 (Champion) */}
          {top3[0] && (
            <div className="order-1 sm:order-2 bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 text-center flex flex-col items-center justify-between shadow-2xl shadow-amber-500/10">
              <div className="relative">
                <Crown className="w-6 h-6 text-amber-400 mx-auto -mb-1 animate-bounce" />
                <div className="w-14 h-14 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center font-black text-xl mb-2 border border-amber-500/50 shadow-inner">
                  1
                </div>
              </div>
              <div className="font-black text-white text-base truncate max-w-full">
                {top3[0].userName}
              </div>
              <div className="mt-2 text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-4 py-1.5 rounded-full border border-amber-500/40">
                Score: {top3[0].score} ({top3[0].percentage}%)
              </div>
              <div className="mt-2 text-xs text-slate-300 flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {formatDuration(top3[0].timeSpentSeconds)}
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {top3[2] && (
            <div className="order-3 sm:order-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-center flex flex-col items-center justify-between shadow-lg sm:translate-y-6">
              <div className="w-10 h-10 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center font-black text-sm mb-2 border border-amber-700/30">
                3
              </div>
              <div className="font-bold text-white text-sm truncate max-w-full">
                {top3[2].userName}
              </div>
              <div className="mt-2 text-xs font-mono font-bold text-slate-300 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                Score: {top3[2].score} ({top3[2].percentage}%)
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {formatDuration(top3[2].timeSpentSeconds)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ranked Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl mt-6">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            All Competitors ({leaderboard.length})
          </h3>
          <span className="text-xs text-slate-400">Ranked by Score & Time</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading arena rankings...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No attempts recorded yet. Be the first champion!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {leaderboard.map((entry, index) => {
              const isTop = index < 3;
              return (
                <div
                  key={entry.userId || index}
                  className={`px-6 py-3.5 flex items-center justify-between gap-3 transition-colors ${
                    isTop ? 'bg-slate-850/40' : 'hover:bg-slate-850/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? 'bg-amber-400 text-black font-black'
                          : index === 1
                          ? 'bg-slate-300 text-black'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'text-slate-500 font-mono'
                      }`}
                    >
                      {index + 1}
                    </span>

                    <span className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                      {entry.userName}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 text-xs">
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400">
                        {entry.score} pts
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {entry.percentage}%
                      </span>
                    </div>

                    <div className="text-right font-mono text-slate-300 min-w-[50px]">
                      {formatDuration(entry.timeSpentSeconds)}
                    </div>
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
