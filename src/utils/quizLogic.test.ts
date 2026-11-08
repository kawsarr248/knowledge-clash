import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQuizResults,
  formatDuration,
  isValidShareCode,
  generateShareCode,
  Question,
} from './quizLogic.ts';

const mockQuestions: Question[] = [
  {
    id: 'q1',
    prompt: 'What is $2 + 2$?',
    options: ['3', '4', '5', '6'],
    correctOptionIndex: 1, // '4'
    explanation: '$2 + 2 = 4$',
  },
  {
    id: 'q2',
    prompt: 'কাজী নজরুল ইসলাম কী নামে পরিচিত?',
    options: ['পল্লীকবি', 'বিদ্রোহী কবি', 'বিশ্বকবি', 'জীবনানন্দ'],
    correctOptionIndex: 1, // 'বিদ্রোহী কবি'
    explanation: 'কাজী নজরুল ইসলাম বাংলাদেশের জাতীয় কবি ও বিদ্রোহী কবি।',
  },
  {
    id: 'q3',
    prompt: 'Derivative of $x^2$ is:',
    options: ['$x$', '$2x$', '$2$', '$x^3/3$'],
    correctOptionIndex: 1, // '$2x$'
    explanation: '$\\\\frac{d}{dx}(x^2) = 2x$',
  },
  {
    id: 'q4',
    prompt: 'Capital of France?',
    options: ['London', 'Berlin', 'Madrid', 'Paris'],
    correctOptionIndex: 3, // 'Paris'
    explanation: 'Paris is the capital of France.',
  },
];

test('calculateQuizResults: calculates 100% score correctly', () => {
  const answers: Record<string, number | null> = {
    q1: 1,
    q2: 1,
    q3: 1,
    q4: 3,
  };
  const result = calculateQuizResults(mockQuestions, answers);
  assert.equal(result.totalQuestions, 4);
  assert.equal(result.correctCount, 4);
  assert.equal(result.wrongCount, 0);
  assert.equal(result.skippedCount, 0);
  assert.equal(result.scorePercentage, 100);
  assert.equal(result.grade, 'S');
  assert.equal(result.wrongAnswersOnly.length, 0);
});

test('calculateQuizResults: isolates wrong answers and skipped questions', () => {
  const answers: Record<string, number | null> = {
    q1: 0, // Wrong: picked '3' instead of '4'
    q2: 1, // Correct
    q3: null, // Skipped
    q4: 0, // Wrong: picked 'London' instead of 'Paris'
  };
  const result = calculateQuizResults(mockQuestions, answers);
  assert.equal(result.totalQuestions, 4);
  assert.equal(result.correctCount, 1);
  assert.equal(result.wrongCount, 2);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.scorePercentage, 25);
  assert.equal(result.grade, 'F');

  // Should have 3 in wrongAnswersOnly (2 wrong + 1 skipped)
  assert.equal(result.wrongAnswersOnly.length, 3);
  const q1Analysis = result.wrongAnswersOnly.find((item) => item.questionId === 'q1');
  assert.ok(q1Analysis);
  assert.equal(q1Analysis.selectedOptionIndex, 0);
  assert.equal(q1Analysis.correctOptionIndex, 1);
  assert.equal(q1Analysis.isCorrect, false);
});

test('formatDuration: correctly formats seconds into mm:ss and hh:mm:ss', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(600), '10:00');
  assert.equal(formatDuration(3665), '1h 01m 05s');
});

test('shareCode validation and generator', () => {
  assert.equal(isValidShareCode('MATH-102'), true);
  assert.equal(isValidShareCode('QZ-9981'), true);
  assert.equal(isValidShareCode(''), false);
  assert.equal(isValidShareCode('a'), false);

  const generated = generateShareCode('MATH');
  assert.ok(generated.startsWith('MATH-'));
  assert.equal(isValidShareCode(generated), true);
});
