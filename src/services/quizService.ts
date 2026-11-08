import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Quiz, QuizAttempt, LeaderboardEntry, Category, UserProfile, UserRole } from '../types/quiz';
import { INITIAL_CATEGORIES } from './mockSeedData';

const LOCAL_STORAGE_KEY_QUIZZES = 'quizpulse_cached_quizzes';
const LOCAL_STORAGE_KEY_ATTEMPTS = 'quizpulse_cached_attempts';
const LOCAL_STORAGE_KEY_CATEGORIES = 'quizpulse_cached_categories';
const LOCAL_STORAGE_KEY_USERS = 'quizpulse_cached_users';

/* ============================================================
   CATEGORIES MANAGEMENT
============================================================ */

export function getLocalCategories(): Category[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Local categories error', e);
  }
  return INITIAL_CATEGORIES;
}

export function saveLocalCategories(cats: Category[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(cats));
  } catch (e) {
    console.warn('Local storage error', e);
  }
}

export async function getCategories(): Promise<Category[]> {
  const local = getLocalCategories();
  try {
    const snap = await getDocs(collection(db, 'categories'));
    const remote: Category[] = [];
    snap.forEach((d) => remote.push(d.data() as Category));

    if (remote.length > 0) {
      saveLocalCategories(remote);
      return remote;
    }
  } catch (error) {
    console.warn('Firestore categories fetch fallback to local:', error);
  }
  return local;
}

export async function saveCategory(category: Category): Promise<void> {
  const current = getLocalCategories().filter((c) => c.id !== category.id);
  const updated = [...current, category];
  saveLocalCategories(updated);

  try {
    await setDoc(doc(db, 'categories', category.id), category);
  } catch (error) {
    console.warn('Firestore save category error, saved locally:', error);
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const current = getLocalCategories().filter((c) => c.id !== categoryId);
  saveLocalCategories(current);

  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    console.warn('Firestore delete category error, deleted locally:', error);
  }
}

/* ============================================================
   QUIZZES MANAGEMENT
============================================================ */

export function getInitialQuizzes(): Quiz[] {
  return getLocalQuizzes();
}

export async function getQuizzes(): Promise<Quiz[]> {
  const local = getLocalQuizzes();
  try {
    const fetchPromise = getDocs(collection(db, 'quizzes'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 2500)
    );

    const qSnapshot = (await Promise.race([fetchPromise, timeoutPromise])) as any;
    const firestoreQuizzes: Quiz[] = [];
    qSnapshot.forEach((d: any) => {
      firestoreQuizzes.push(d.data() as Quiz);
    });

    const map = new Map<string, Quiz>();
    local.forEach((q) => map.set(q.id, q));
    firestoreQuizzes.forEach((q) => map.set(q.id, q));

    const merged = Array.from(map.values());
    localStorage.setItem(LOCAL_STORAGE_KEY_QUIZZES, JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.warn('Using local quizzes (Firestore syncing in background):', error);
    return local;
  }
}

export async function getQuizByIdOrCode(idOrCode: string): Promise<Quiz | null> {
  const clean = idOrCode.trim();
  // Check instant local storage cache first
  const local = getLocalQuizzes();
  const localFound = local.find(
    (q) => q.id === clean || (q.shareCode && q.shareCode.toUpperCase() === clean.toUpperCase())
  );
  if (localFound) return localFound;

  try {
    const docSnap = await getDoc(doc(db, 'quizzes', clean));
    if (docSnap.exists()) {
      return docSnap.data() as Quiz;
    }
  } catch (error) {
    console.warn('Error fetching quiz by ID:', error);
  }

  // Fallback to async getQuizzes
  const quizzes = await getQuizzes();
  const found = quizzes.find(
    (q) => q.id === clean || (q.shareCode && q.shareCode.toUpperCase() === clean.toUpperCase())
  );
  return found || null;
}

export async function saveQuiz(quiz: Quiz): Promise<void> {
  saveQuizToLocal(quiz);
  try {
    await setDoc(doc(db, 'quizzes', quiz.id), quiz);
  } catch (error) {
    console.warn('Could not persist quiz to remote Firestore, saved locally:', error);
  }
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const list = getLocalQuizzes().filter((q) => q.id !== quizId);
  localStorage.setItem(LOCAL_STORAGE_KEY_QUIZZES, JSON.stringify(list));

  try {
    await deleteDoc(doc(db, 'quizzes', quizId));
  } catch (error) {
    console.warn('Could not delete quiz from remote Firestore, deleted locally:', error);
  }
}

/* ============================================================
   USER ROLES & PROFILES (TEACHER VS STUDENT)
============================================================ */

export async function syncUserProfile(profile: UserProfile): Promise<UserProfile> {
  // Save locally
  const currentUsers = getLocalUsers();
  const existingIdx = currentUsers.findIndex((u) => u.id === profile.id);
  if (existingIdx >= 0) {
    // Preserve existing role if set by teacher
    profile.role = currentUsers[existingIdx].role || profile.role;
    currentUsers[existingIdx] = profile;
  } else {
    currentUsers.push(profile);
  }
  saveLocalUsers(currentUsers);

  try {
    const userRef = doc(db, 'users', profile.id);
    const existingSnap = await getDoc(userRef);
    if (existingSnap.exists()) {
      const data = existingSnap.data() as UserProfile;
      // Preserve assigned role from database
      profile.role = data.role || profile.role;
      await updateDoc(userRef, {
        displayName: profile.displayName,
        photoURL: profile.photoURL || '',
        updatedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(userRef, profile);
    }
  } catch (e) {
    console.warn('Firestore profile sync error:', e);
  }
  return profile;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const local = getLocalUsers();
  try {
    const snap = await getDocs(collection(db, 'users'));
    const remote: UserProfile[] = [];
    snap.forEach((d) => remote.push(d.data() as UserProfile));

    if (remote.length > 0) {
      saveLocalUsers(remote);
      return remote;
    }
  } catch (e) {
    console.warn('Firestore getAllUsers fallback to local:', e);
  }
  return local;
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  const users = getLocalUsers().map((u) => (u.id === userId ? { ...u, role: newRole } : u));
  saveLocalUsers(users);

  try {
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Firestore updateUserRole error, updated locally:', e);
  }
}

function getLocalUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.warn('Local storage error', e);
  }
}

/* ============================================================
   QUIZ ATTEMPTS & LEADERBOARDS
============================================================ */

export async function saveQuizAttempt(attempt: QuizAttempt): Promise<void> {
  saveAttemptToLocal(attempt);

  try {
    await setDoc(doc(db, 'attempts', attempt.id), {
      id: attempt.id,
      quizId: attempt.quizId,
      quizTitle: attempt.quizTitle,
      userId: attempt.userId,
      userName: attempt.userName,
      userPhotoURL: attempt.userPhotoURL || '',
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      percentage: attempt.percentage,
      timeSpentSeconds: attempt.timeSpentSeconds,
      wrongAnswersCount: attempt.wrongAnswersCount,
      completedAt: attempt.completedAt,
    });

    const leaderboardRef = doc(db, 'quizzes', attempt.quizId, 'leaderboard', attempt.userId);
    const existingLeaderboardDoc = await getDoc(leaderboardRef);

    let shouldUpdateLeaderboard = true;
    if (existingLeaderboardDoc.exists()) {
      const existing = existingLeaderboardDoc.data() as LeaderboardEntry;
      if (existing.score > attempt.score) {
        shouldUpdateLeaderboard = false;
      } else if (
        existing.score === attempt.score &&
        existing.timeSpentSeconds <= attempt.timeSpentSeconds
      ) {
        shouldUpdateLeaderboard = false;
      }
    }

    if (shouldUpdateLeaderboard) {
      await setDoc(leaderboardRef, {
        userId: attempt.userId,
        quizId: attempt.quizId,
        userName: attempt.userName,
        userPhotoURL: attempt.userPhotoURL || '',
        score: attempt.score,
        percentage: attempt.percentage,
        timeSpentSeconds: attempt.timeSpentSeconds,
        completedAt: attempt.completedAt,
      });
    }
  } catch (error) {
    console.warn('Could not save attempt to remote Firestore, saved locally:', error);
  }
}

export async function getQuizLeaderboard(quizId: string): Promise<LeaderboardEntry[]> {
  try {
    const lbCollection = collection(db, 'quizzes', quizId, 'leaderboard');
    const lbQuery = query(lbCollection, orderBy('score', 'desc'), limit(25));
    const snap = await getDocs(lbQuery);

    const entries: LeaderboardEntry[] = [];
    snap.forEach((d) => {
      entries.push(d.data() as LeaderboardEntry);
    });

    if (entries.length > 0) {
      entries.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timeSpentSeconds - b.timeSpentSeconds;
      });
      return entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
    }
  } catch (error) {
    console.warn('Firestore leaderboard query error, using local attempts:', error);
  }

  const attempts = getLocalAttempts().filter((a) => a.quizId === quizId);
  const userTop = new Map<string, LeaderboardEntry>();

  attempts.forEach((a) => {
    const current = userTop.get(a.userId);
    if (!current || a.score > current.score) {
      userTop.set(a.userId, {
        userId: a.userId,
        quizId: a.quizId,
        userName: a.userName,
        userPhotoURL: a.userPhotoURL,
        score: a.score,
        percentage: a.percentage,
        timeSpentSeconds: a.timeSpentSeconds,
        completedAt: a.completedAt,
      });
    }
  });

  const list = Array.from(userTop.values());
  list.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.timeSpentSeconds - b.timeSpentSeconds));
  return list.map((item, index) => ({ ...item, rank: index + 1 }));
}

export async function getUserAttempts(userId: string): Promise<QuizAttempt[]> {
  const local = getLocalAttempts().filter((a) => a.userId === userId);
  try {
    const q = query(collection(db, 'attempts'), where('userId', '==', userId), limit(30));
    const snap = await getDocs(q);
    const remote: QuizAttempt[] = [];
    snap.forEach((d) => remote.push(d.data() as QuizAttempt));

    const map = new Map<string, QuizAttempt>();
    remote.forEach((a) => map.set(a.id, a));
    local.forEach((a) => map.set(a.id, a));

    const result = Array.from(map.values());
    result.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    return result;
  } catch (error) {
    console.warn('Error fetching user attempts from Firestore:', error);
    return local.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }
}

// Local Storage helpers for Quizzes & Attempts
function getLocalQuizzes(): Quiz[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_QUIZZES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQuizToLocal(quiz: Quiz) {
  try {
    const list = getLocalQuizzes().filter((q) => q.id !== quiz.id);
    list.unshift(quiz);
    localStorage.setItem(LOCAL_STORAGE_KEY_QUIZZES, JSON.stringify(list));
  } catch (e) {
    console.warn('Local storage error', e);
  }
}

export function getLocalAttempts(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAttemptToLocal(attempt: QuizAttempt) {
  try {
    const list = getLocalAttempts().filter((a) => a.id !== attempt.id);
    list.unshift(attempt);
    localStorage.setItem(LOCAL_STORAGE_KEY_ATTEMPTS, JSON.stringify(list));
  } catch (e) {
    console.warn('Local storage error', e);
  }
}
