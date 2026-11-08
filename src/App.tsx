import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Quiz, QuizAttempt, QuestionAnalysis, Category } from './types/quiz';
import {
  getQuizzes,
  getInitialQuizzes,
  saveQuiz,
  deleteQuiz,
  saveQuizAttempt,
  getQuizByIdOrCode,
  getCategories,
  getLocalCategories,
} from './services/quizService';
import { calculateQuizResults, QuizScoreSummary } from './utils/quizLogic';
import { Navbar } from './components/Navbar';
import { QuizList } from './components/QuizList';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResultDashboard } from './components/QuizResultDashboard';
import { QuizCreator } from './components/QuizCreator';
import { LeaderboardView } from './components/LeaderboardView';
import { UserHistoryDashboard } from './components/UserHistoryDashboard';
import { AuthModal } from './components/AuthModal';
import { ShareModal } from './components/ShareModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { RoleManagerModal } from './components/RoleManagerModal';
import { Sparkles, Trophy, History } from 'lucide-react';

function QuizApp() {
  const { effectiveUserId, effectiveUserName, effectiveUserPhoto, isTeacher } = useAuth();
  // Check URL params synchronously for direct quiz link
  const getDirectQuizFromUrl = (): Quiz | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const quizIdParam = params.get('quiz') || params.get('id') || params.get('pin');
    if (!quizIdParam) return null;
    const initialList = getInitialQuizzes();
    return (
      initialList.find(
        (q) => q.id === quizIdParam || (q.shareCode && q.shareCode.toUpperCase() === quizIdParam.toUpperCase())
      ) || null
    );
  };

  const directQuiz = getDirectQuizFromUrl();
  const [activeTab, setActiveTab] = useState<'explore' | 'create' | 'history' | 'leaderboard'>('explore');
  const [quizzes, setQuizzes] = useState<Quiz[]>(getInitialQuizzes);
  const [categories, setCategories] = useState<Category[]>(getLocalCategories);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(directQuiz);
  const [isPlaying, setIsPlaying] = useState(!!directQuiz);
  const [activeSummary, setActiveSummary] = useState<QuizScoreSummary | null>(null);
  const [lastTimeSpent, setLastTimeSpent] = useState(0);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [sharingQuiz, setSharingQuiz] = useState<Quiz | null>(null);
  const [leaderboardQuizId, setLeaderboardQuizId] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<string | null>(null);

  // Load quizzes and categories on mount & check URL params if not already found
  useEffect(() => {
    // 1. Check URL parameters if not loaded synchronously
    const params = new URLSearchParams(window.location.search);
    const quizIdParam = params.get('quiz') || params.get('id') || params.get('pin');

    if (quizIdParam && !activeQuiz) {
      getQuizByIdOrCode(quizIdParam).then((fetched) => {
        if (fetched) {
          setActiveQuiz(fetched);
          setIsPlaying(true);
        }
      });
    }

    // 2. Fetch categories
    getCategories().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    });

    // 3. Fetch quizzes
    getQuizzes().then((data) => {
      setQuizzes(data);
    });
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Start test
  const handleSelectQuizToPlay = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setIsPlaying(true);
    setActiveSummary(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete quiz (Teacher only)
  const handleDeleteQuiz = async (quizId: string) => {
    await deleteQuiz(quizId);
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    showNotification('Quiz deleted successfully.');
  };

  // Complete test
  const handleCompleteQuiz = async (
    userAnswers: Record<string, number | null>,
    timeSpentSeconds: number
  ) => {
    if (!activeQuiz) return;

    const summary = calculateQuizResults(activeQuiz.questions, userAnswers);
    setActiveSummary(summary);
    setLastTimeSpent(timeSpentSeconds);
    setIsPlaying(false);

    // Save attempt record
    const attempt: QuizAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      userId: effectiveUserId,
      userName: effectiveUserName,
      userPhotoURL: effectiveUserPhoto || '',
      score: summary.correctCount,
      totalQuestions: summary.totalQuestions,
      percentage: summary.scorePercentage,
      timeSpentSeconds,
      wrongAnswersCount: summary.wrongCount + summary.skippedCount,
      completedAt: new Date().toISOString(),
      questionsAnalysis: summary.questionsAnalysis,
    };

    await saveQuizAttempt(attempt);

    // Increment play count
    const updatedQuiz: Quiz = {
      ...activeQuiz,
      playsCount: (activeQuiz.playsCount || 0) + 1,
    };
    saveQuiz(updatedQuiz);
    setQuizzes((prev) => prev.map((q) => (q.id === updatedQuiz.id ? updatedQuiz : q)));

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Retake only the questions answered wrong
  const handleRetakeMistakesOnly = (mistakes: QuestionAnalysis[]) => {
    if (!activeQuiz) return;
    const mistakeQuestionIds = new Set(mistakes.map((m) => m.questionId));
    const filteredQuestions = activeQuiz.questions.filter((q) => mistakeQuestionIds.has(q.id));

    if (filteredQuestions.length === 0) return;

    const mistakeQuiz: Quiz = {
      ...activeQuiz,
      id: `mistake-review-${Date.now()}`,
      title: `[Mistake Practice] ${activeQuiz.title}`,
      questions: filteredQuestions,
      questionsCount: filteredQuestions.length,
      timeLimitMinutes: Math.max(2, Math.round(activeQuiz.timeLimitMinutes * (filteredQuestions.length / activeQuiz.questions.length))),
    };

    setActiveQuiz(mistakeQuiz);
    setIsPlaying(true);
    setActiveSummary(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Create quiz finished
  const handleQuizCreated = async (newQuiz: Quiz) => {
    await saveQuiz(newQuiz);
    setQuizzes((prev) => [newQuiz, ...prev]);
    showNotification(`Quiz published successfully! Share link ready.`);
    setSharingQuiz(newQuiz);
    setActiveTab('explore');
  };

  // Review a past attempt from history
  const handleReviewPastAttempt = (attempt: QuizAttempt, quiz: Quiz) => {
    setActiveQuiz(quiz);
    setIsPlaying(false);

    const analysis = attempt.questionsAnalysis || [];
    if (analysis.length > 0) {
      const summary: QuizScoreSummary = {
        totalQuestions: attempt.totalQuestions,
        answeredCount: attempt.totalQuestions - analysis.filter((a) => a.selectedOptionIndex === null).length,
        correctCount: attempt.score,
        wrongCount: attempt.wrongAnswersCount,
        skippedCount: analysis.filter((a) => a.selectedOptionIndex === null).length,
        scorePercentage: attempt.percentage,
        grade: attempt.percentage >= 90 ? 'S' : attempt.percentage >= 80 ? 'A' : attempt.percentage >= 70 ? 'B' : attempt.percentage >= 60 ? 'C' : 'F',
        feedbackText: 'Historical Attempt Review',
        questionsAnalysis: analysis,
        wrongAnswersOnly: analysis.filter((a) => !a.isCorrect),
      };
      setActiveSummary(summary);
      setLastTimeSpent(attempt.timeSpentSeconds);
    } else {
      setActiveQuiz(quiz);
      setIsPlaying(true);
      setActiveSummary(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-18 right-4 z-50 px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-2xl shadow-2xl border border-indigo-400/40 animate-in slide-in-from-top-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Global Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setIsPlaying(false);
          setActiveSummary(null);
          setActiveTab(tab);
        }}
        onOpenCategories={() => setIsCategoryModalOpen(true)}
        onOpenRoles={() => setIsRoleModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Test Engine View */}
        {isPlaying && activeQuiz ? (
          <QuizPlayer
            quiz={activeQuiz}
            onComplete={handleCompleteQuiz}
            onExit={() => {
              setIsPlaying(false);
              setActiveQuiz(null);
              if (typeof window !== 'undefined' && window.location.search) {
                window.history.replaceState({}, '', window.location.pathname);
              }
            }}
          />
        ) : activeSummary && activeQuiz ? (
          /* Wrong Answers & Detailed Score Summary Dashboard */
          <QuizResultDashboard
            quiz={activeQuiz}
            summary={activeSummary}
            timeSpentSeconds={lastTimeSpent}
            onRetakeAll={() => {
              setIsPlaying(true);
              setActiveSummary(null);
            }}
            onRetakeMistakesOnly={handleRetakeMistakesOnly}
            onViewLeaderboard={() => {
              setLeaderboardQuizId(activeQuiz.id);
              setActiveSummary(null);
              setActiveTab('leaderboard');
            }}
            onExploreMore={() => {
              setActiveSummary(null);
              setActiveQuiz(null);
              setActiveTab('explore');
            }}
            onShareScore={() => setSharingQuiz(activeQuiz)}
          />
        ) : activeTab === 'explore' ? (
          /* Explore Quizzes Catalog */
          <QuizList
            quizzes={quizzes}
            categories={categories}
            onSelectQuiz={handleSelectQuizToPlay}
            onViewLeaderboard={(q) => {
              setLeaderboardQuizId(q.id);
              setActiveTab('leaderboard');
            }}
            onOpenCreate={() => setActiveTab('create')}
            onOpenCategories={() => setIsCategoryModalOpen(true)}
            onShareQuiz={(q) => setSharingQuiz(q)}
            onDeleteQuiz={handleDeleteQuiz}
          />
        ) : activeTab === 'create' ? (
          /* Quiz Creator Studio (AI + Manual) */
          <QuizCreator
            categories={categories}
            onQuizCreated={handleQuizCreated}
            onCancel={() => setActiveTab('explore')}
            onOpenCategories={() => setIsCategoryModalOpen(true)}
          />
        ) : activeTab === 'leaderboard' ? (
          /* Competitive Arena Leaderboard */
          <LeaderboardView
            quizzes={quizzes}
            initialQuizId={leaderboardQuizId}
            onTakeQuiz={handleSelectQuizToPlay}
            onShareQuiz={(q) => setSharingQuiz(q)}
          />
        ) : activeTab === 'history' ? (
          /* My Attempts & Mistake Analytics */
          <UserHistoryDashboard
            quizzes={quizzes}
            onReviewAttempt={handleReviewPastAttempt}
            onRetakeQuiz={handleSelectQuizToPlay}
            onExplore={() => setActiveTab('explore')}
          />
        ) : null}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ShareModal
        quiz={sharingQuiz}
        onClose={() => setSharingQuiz(null)}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategoriesUpdated={(cats) => setCategories(cats)}
      />

      <RoleManagerModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            QuizPulse • Teacher-managed quizzes in বাংলা (Bangla), English & custom subject categories.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('explore')}
              className="hover:text-slate-300 transition-colors"
            >
              All Quizzes
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className="hover:text-slate-300 transition-colors"
            >
              Leaderboards
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="hover:text-slate-300 transition-colors"
            >
              Mistakes Review
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QuizApp />
    </AuthProvider>
  );
}
