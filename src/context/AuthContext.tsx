import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from '../services/firebase';
import { UserRole, UserProfile } from '../types/quiz';
import { syncUserProfile } from '../services/quizService';

const BOOTSTRAPPED_TEACHER_EMAIL = 'kawsarr248@gmail.com';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isGuest: boolean;
  guestName: string;
  setGuestNickname: (name: string) => void;
  role: UserRole;
  isTeacher: boolean;
  setRole: (role: UserRole) => void;
  effectiveUserId: string;
  effectiveUserName: string;
  effectiveUserPhoto: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('quizpulse_user_role') as UserRole) || 'teacher'; // default initial session as teacher so creator can configure categories immediately
  });
  const [guestName, setGuestName] = useState(() => {
    return localStorage.getItem('quizpulse_guest_name') || 'Scholar';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // If it's the primary teacher email, automatically grant teacher role
        const isMasterAdmin = user.email?.toLowerCase() === BOOTSTRAPPED_TEACHER_EMAIL.toLowerCase();
        const initialRole: UserRole = isMasterAdmin ? 'teacher' : (role || 'student');
        
        const profile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || '',
          role: initialRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const synced = await syncUserProfile(profile);
        setRoleState(synced.role);
        localStorage.setItem('quizpulse_user_role', synced.role);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('quizpulse_user_role', newRole);
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: unknown) {
      console.error('Email Sign-In Error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
    } catch (error: unknown) {
      console.error('Email Sign-Up Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const setGuestNickname = (name: string) => {
    const val = name.trim() || 'Scholar';
    setGuestName(val);
    localStorage.setItem('quizpulse_guest_name', val);
  };

  const isGuest = !currentUser;
  const isTeacher = role === 'teacher' || (currentUser?.email?.toLowerCase() === BOOTSTRAPPED_TEACHER_EMAIL.toLowerCase());
  const effectiveUserId = currentUser ? currentUser.uid : `user-${guestName.replace(/\s+/g, '').toLowerCase()}`;
  const effectiveUserName = currentUser ? currentUser.displayName || currentUser.email?.split('@')[0] || 'User' : guestName;
  const effectiveUserPhoto = currentUser?.photoURL || null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        isGuest,
        guestName,
        setGuestNickname,
        role,
        isTeacher,
        setRole,
        effectiveUserId,
        effectiveUserName,
        effectiveUserPhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
