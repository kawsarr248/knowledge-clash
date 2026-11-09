import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Trophy,
  History,
  PlusCircle,
  Compass,
  LogOut,
  User as UserIcon,
  Tag,
  Users,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'explore' | 'create' | 'history' | 'leaderboard';
  setActiveTab: (tab: 'explore' | 'create' | 'history' | 'leaderboard') => void;
  onOpenCategories: () => void;
  onOpenRoles: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCategories,
  onOpenRoles,
  onOpenAuth,
}) => {
  const { currentUser, logout, effectiveUserName, effectiveUserPhoto, isTeacher, role, setRole } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Logo */}
          <div
            onClick={() => setActiveTab('explore')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
              <img
  src="/favicon-96x96[1].png"
  alt="Knowledge Clash"
  className="w-full h-full object-contain"
/>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Knowledge<span className="text-indigo-400">Clash</span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    isTeacher
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}
                >
                  {isTeacher ? 'Teacher' : 'Student'}
                </span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'explore'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Quizzes</span>
            </button>

            {isTeacher && (
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'create'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Create / AI Quiz</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>Mistakes & History</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Leaderboard</span>
            </button>
          </nav>

          {/* Teacher Controls & Auth Button */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {isTeacher && (
              <>
                <button
                  onClick={onOpenCategories}
                  title="Manage Subject Categories"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all"
                >
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Categories</span>
                </button>

                <button
                  onClick={onOpenRoles}
                  title="Manage Roles (Teachers / Students)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 hover:text-purple-200 border border-purple-500/30 text-xs font-semibold transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Roles</span>
                </button>
              </>
            )}

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all"
                >
                  {effectiveUserPhoto ? (
                    <img
                      src={effectiveUserPhoto}
                      alt={effectiveUserName}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-indigo-500/40"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-500/30">
                      {effectiveUserName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate hidden sm:inline">
                    {effectiveUserName}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 z-50">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-white truncate">
                        {effectiveUserName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Role:</span>
                        <span className="font-bold uppercase text-indigo-400">
                          {role}
                        </span>
                      </div>
                    </div>

                    {isTeacher && (
                      <>
                        <button
                          onClick={() => {
                            onOpenCategories();
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Tag className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Manage Categories</span>
                        </button>
                        <button
                          onClick={() => {
                            onOpenRoles();
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-purple-300 hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Teacher / Student Roles</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setActiveTab('history');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <History className="w-3.5 h-3.5 text-amber-400" />
                      <span>My Test Mistakes</span>
                    </button>

                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800/80"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile bottom nav bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center gap-0.5 text-[11px] ${
              activeTab === 'explore' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Quizzes</span>
          </button>
          {isTeacher && (
            <button
              onClick={() => setActiveTab('create')}
              className={`flex flex-col items-center gap-0.5 text-[11px] ${
                activeTab === 'create' ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-0.5 text-[11px] ${
              activeTab === 'history' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Mistakes</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center gap-0.5 text-[11px] ${
              activeTab === 'leaderboard' ? 'text-yellow-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Ranks</span>
          </button>
        </div>
      </div>
    </header>
  );
};
