export interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  hasMath?: boolean;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionIndex: number | null; // null if skipped
}

export interface QuestionAnalysis {
  questionId: string;
  prompt: string;
  options: string[];
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation: string;
  hasMath?: boolean;
}

export interface QuizScoreSummary {
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  scorePercentage: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  feedbackText: string;
  questionsAnalysis: QuestionAnalysis[];
  wrongAnswersOnly: QuestionAnalysis[];
}

/**
 * Calculates detailed score summary and wrong answers breakdown
 */
export function calculateQuizResults(
  questions: Question[],
  userAnswers: Record<string, number | null>
): QuizScoreSummary {
  const totalQuestions = questions.length;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  const questionsAnalysis: QuestionAnalysis[] = questions.map((q) => {
    const selected = userAnswers[q.id] ?? null;
    const isCorrect = selected !== null && selected === q.correctOptionIndex;

    if (selected === null) {
      skippedCount++;
    } else if (isCorrect) {
      correctCount++;
    } else {
      wrongCount++;
    }

    return {
      questionId: q.id,
      prompt: q.prompt,
      options: q.options,
      selectedOptionIndex: selected,
      correctOptionIndex: q.correctOptionIndex,
      isCorrect,
      explanation: q.explanation || 'No explanation provided.',
      hasMath: q.hasMath,
    };
  });

  const answeredCount = correctCount + wrongCount;
  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  let grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  let feedbackText = '';

  if (scorePercentage >= 90) {
    grade = 'S';
    feedbackText = 'অসাধারণ! Outstanding Mastery!';
  } else if (scorePercentage >= 80) {
    grade = 'A';
    feedbackText = 'চমৎকার! Great performance!';
  } else if (scorePercentage >= 70) {
    grade = 'B';
    feedbackText = 'ভালো! Good job, review the mistakes to improve!';
  } else if (scorePercentage >= 60) {
    grade = 'C';
    feedbackText = 'সন্তোষজনক! Satisfactory, practice more!';
  } else if (scorePercentage >= 40) {
    grade = 'D';
    feedbackText = 'আরও অনুশীলন প্রয়োজন! Needs improvement.';
  } else {
    grade = 'F';
    feedbackText = 'মনোযোগ দিয়ে ভুলগুলো পর্যালোচনা করুন! Review wrong answers thoroughly!';
  }

  const wrongAnswersOnly = questionsAnalysis.filter((qa) => !qa.isCorrect);

  return {
    totalQuestions,
    answeredCount,
    correctCount,
    wrongCount,
    skippedCount,
    scorePercentage,
    grade,
    feedbackText,
    questionsAnalysis,
    wrongAnswersOnly,
  };
}

/**
 * Formats time spent in mm:ss or hh:mm:ss
 */
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Validates share codes (uppercase alphanumeric with optional hyphen, 4-12 chars)
 */
export function isValidShareCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim().toUpperCase();
  return /^[A-Z0-9-]{4,12}$/.test(trimmed);
}

/**
 * Generates an intuitive share code like 'MATH-829' or 'BN-491'
 */
export function generateShareCode(prefix = 'QZ'): string {
  const cleanPrefix = prefix.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 4) || 'QZ';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${cleanPrefix}-${randomNum}`;
}
