import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini client server-side with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface GenerateQuizRequest {
  topic: string;
  language: string; // 'bn' | 'en' | 'es' | 'hi' etc.
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  includeMath: boolean;
  customPrompt?: string;
}

export interface GeneratedQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  hasMath: boolean;
}

export async function generateQuizWithGemini(
  params: GenerateQuizRequest
): Promise<GeneratedQuestion[]> {
  const { topic, language, difficulty, questionCount = 5, includeMath = false, customPrompt = '' } = params;

  const languageInstruction =
    language === 'bn'
      ? 'The language of questions, options, and explanations MUST BE IN BENGALI (বাংলা ভাষা), with natural grammar, correct spelling, and academic Bengali terminology.'
      : language === 'es'
      ? 'The language of questions, options, and explanations MUST BE IN SPANISH (Español).'
      : language === 'hi'
      ? 'The language of questions, options, and explanations MUST BE IN HINDI (हिन्दी).'
      : language === 'fr'
      ? 'The language of questions, options, and explanations MUST BE IN FRENCH (Français).'
      : language === 'ar'
      ? 'The language of questions, options, and explanations MUST BE IN ARABIC (العربية).'
      : 'The language of questions, options, and explanations MUST BE IN ENGLISH.';

  const mathInstruction = includeMath
    ? `IMPORTANT: This is a MATHEMATICS or STEM quiz. Every question or option involving formulas, variables, derivatives, integrals, roots, powers, or fractions MUST use valid LaTeX syntax enclosed within single dollar signs like $x^2 + 2x + 1 = 0$ or $\\frac{a}{b}$ or $\\sqrt{x}$ or double dollar signs for block equations. Keep LaTeX clean and standard KaTeX compatible.`
    : `If mathematical formulas or equations appear, enclose them within $ ... $ in LaTeX.`;

  const systemInstruction = `You are an expert multi-lingual academic MCQ test creator and psychometric exam designer.
Your task is to generate high-quality, unambiguous, pedagogically sound Multiple Choice Questions (MCQs) for competitive quizzes.
${languageInstruction}
${mathInstruction}
Requirements:
1. Generate exactly ${questionCount} questions.
2. Difficulty level: ${difficulty}.
3. Every question must have exactly 4 options.
4. Exactly one option must be strictly correct. The correctOptionIndex must be an integer between 0 and 3.
5. Provide a clear, thorough explanation that explains WHY the correct option is right and breaks down any calculations or logic step-by-step.
6. Make distractors (wrong options) plausible common misconceptions, not nonsense.
${customPrompt ? `Additional user guidelines / syllabus:\n${customPrompt}` : ''}
`;

  const prompt = `Generate a ${questionCount}-question MCQ quiz on the topic: "${topic}".
Difficulty: ${difficulty}.
Ensure rich question variety, accuracy, and clear explanations.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            prompt: {
              type: Type.STRING,
              description: 'The question text, including LaTeX $...$ if mathematical formula.',
            },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: 'Array of exactly 4 choices.',
            },
            correctOptionIndex: {
              type: Type.INTEGER,
              description: 'Zero-based index of the correct answer (0, 1, 2, or 3).',
            },
            explanation: {
              type: Type.STRING,
              description: 'Detailed explanation for the wrong answers review dashboard.',
            },
            hasMath: {
              type: Type.BOOLEAN,
              description: 'True if question or choices contain mathematical formulas or LaTeX.',
            },
          },
          required: ['prompt', 'options', 'correctOptionIndex', 'explanation'],
        },
      },
    },
  });

  const rawText = response.text || '[]';
  const parsed = JSON.parse(rawText) as Array<{
    prompt: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
    hasMath?: boolean;
  }>;

  return parsed.map((item, index) => ({
    id: `ai-q-${Date.now()}-${index + 1}`,
    prompt: item.prompt,
    options: item.options.slice(0, 4),
    correctOptionIndex: Math.min(3, Math.max(0, item.correctOptionIndex ?? 0)),
    explanation: item.explanation || 'See textbook solution.',
    hasMath: Boolean(item.hasMath || item.prompt.includes('$')),
  }));
}
