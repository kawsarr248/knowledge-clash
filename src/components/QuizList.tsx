import React, { useState, useMemo } from 'react';
import { Quiz, Category } from '../types/quiz';
import { MathRenderer } from './MathRenderer';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Clock,
  HelpCircle,
  Trophy,
  Share2,
  Play,
  Flame,
  Globe2,
  Sparkles,
  Tag,
  Trash2,
  PlusCircle,
} from 'lucide-react';

interface QuizListProps {
  quizzes: Quiz[];
  categories: Category[];
  onSelectQuiz: (quiz: Quiz) => void;
  onViewLeaderboard: (quiz: Quiz) => void;
  onOpenCreate: () => void;
  onOpenCategories: () => void;
  onShareQuiz: (quiz: Quiz) => void;
  onDeleteQuiz?: (quizId: string) => void;
}

export const QuizList: React.FC<QuizListProps> = ({
  quizzes,
  categories,
  onSelectQuiz,
  onViewLeaderboard,
  onOpenCreate,
  onOpenCategories,
  onShareQuiz,
  onDeleteQuiz,
}) => {
  const { isTeacher } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchSearch =
        searchQuery === '' ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchLanguage =
        selectedLanguage === 'all' || q.language === selectedLanguage;

      const matchCategory =
        selectedCategory === 'all' || q.category === selectedCategory;

      return matchSearch && matchLanguage && matchCategory;
    });
  }, [quizzes, searchQuery, selectedLanguage, selectedCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Lingual MCQ Platform</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Create, Share & Track Tests
            </h1>
            <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
              Build quizzes in any subject, generate with AI in{' '}
              <strong className="text-white">বাংলা (Bangla)</strong> or other languages, share direct links with students, and review mistakes.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col items-stretch gap-2.5 shrink-0">
            {isTeacher && (
              <button
                onClick={onOpenCreate}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create / AI Quiz</span>
              </button>
            )}

            {isTeacher && (
              <button
                onClick={onOpenCategories}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Configure Categories</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quizzes by title or topic..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Language filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Globe2 className="w-3.5 h-3.5" /> Language:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'bn', label: 'বাংলা (Bangla)' },
              { id: 'en', label: 'English' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguage(lang.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedLanguage === lang.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition-all shrink-0 font-semibold ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Subjects ({quizzes.length})
          </button>

          {categories.map((cat) => {
            const count = quizzes.filter((q) => q.category === cat.name).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all shrink-0 font-semibold ${
                  selectedCategory === cat.name
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.name} {count > 0 && `(${count})`}
              </button>
            );
          })}

          {isTeacher && (
            <button
              onClick={onOpenCategories}
              className="px-2.5 py-1 rounded-xl text-xs text-indigo-400 border border-dashed border-indigo-500/40 hover:bg-indigo-950/30 transition-colors shrink-0 flex items-center gap-1 font-medium"
            >
              <Tag className="w-3 h-3" />
              <span>+ Edit Subjects</span>
            </button>
          )}
        </div>
      </div>

      {/* Quizzes List */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 p-8 space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            {quizzes.length === 0 ? 'No quizzes published yet' : 'No quizzes match this filter'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {quizzes.length === 0
              ? 'Create a quiz manually or generate one instantly using Gemini AI to share with your students!'
              : 'Try clearing your search or category filter.'}
          </p>
          {isTeacher && (
            <button
              onClick={onOpenCreate}
              className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Create New Quiz Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="group relative bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 transition-all shadow-md hover:shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Category & Language */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 truncate max-w-[160px]">
                    {quiz.category || 'General'}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {quiz.language === 'bn' ? 'বাংলা' : quiz.language.toUpperCase()}
                    </span>
                    {isTeacher && onDeleteQuiz && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete quiz "${quiz.title}"?`)) {
                            onDeleteQuiz(quiz.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                  <MathRenderer content={quiz.title} />
                </h3>

                {/* Description */}
                <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  <MathRenderer content={quiz.description} />
                </p>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-2 py-2 px-3 bg-slate-950/70 rounded-xl border border-slate-800/60 text-center">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Questions
                    </span>
                    <span className="text-xs font-bold text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                      <HelpCircle className="w-3 h-3 text-indigo-400" />
                      {quiz.questionsCount || quiz.questions.length}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Time
                    </span>
                    <span className="text-xs font-bold text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes}m` : 'Untimed'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Plays
                    </span>
                    <span className="text-xs font-bold text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                      <Flame className="w-3 h-3 text-rose-400" />
                      {quiz.playsCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onViewLeaderboard(quiz)}
                    title="View Leaderboard"
                    className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trophy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onShareQuiz(quiz)}
                    title="Share Direct Quiz Link"
                    className="px-2.5 py-1 text-slate-300 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Link</span>
                  </button>
                </div>

                <button
                  onClick={() => onSelectQuiz(quiz)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Take Test</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
