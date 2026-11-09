import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/quiz';
import { getAllUsers, updateUserRole } from '../services/quizService';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  ShieldCheck,
  GraduationCap,
  X,
  Search,
  CheckCircle,
  UserCheck,
} from 'lucide-react';

interface RoleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleManagerModal: React.FC<RoleManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isTeacher } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getAllUsers()
      .then((data) => setUsers(data))
      .catch((e) => console.error('Error fetching users', e))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleRole = async (userId: string, currentRole: UserRole) => {
    const nextRole: UserRole = currentRole === 'teacher' ? 'student' : 'teacher';
    await updateUserRole(userId, nextRole);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u))
    );
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Student & Teacher Roles</span>
              </h3>
              <p className="text-xs text-slate-400">
                You control permissions. Others join as Students; you can promote anyone to Teacher.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* User list */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Loading users and roles...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/60 rounded-2xl border border-slate-800">
              No users registered yet. When users sign in, they will appear here as Students.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isUserTeacher = u.role === 'teacher';
              return (
                <div
                  key={u.id}
                  className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isUserTeacher
                          ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                          : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      }`}
                    >
                      {isUserTeacher ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <GraduationCap className="w-4 h-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {u.displayName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        isUserTeacher
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>

                    {user?.email === 'kawsarr248@gmail.com' && (
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          isUserTeacher
                            ? 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                        }`}
                      >
                        {isUserTeacher ? 'Set as Student' : 'Make Teacher'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {users.length} registered accounts
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
