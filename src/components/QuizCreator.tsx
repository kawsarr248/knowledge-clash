import React, { useState } from 'react';
import { Quiz, Question, QuizLanguage, Category } from '../types/quiz';
import { generateShareCode } from '../utils/quizLogic';
import { MathRenderer } from './MathRenderer';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Plus,
  Trash2,
  Clock,
  Layers,
  Globe2,
  AlertCircle,
  Check,
  Loader2,
  Tag,
} from 'lucide-react';

interface QuizCreatorProps {
  categories: Category[];
  onQuizCreated: (quiz: Quiz) => void;
  onCancel: () => void;
  onOpenCategories: () => void;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({
  categories,
  onQuizCreated,
  onCancel,
  onOpenCategories,
}) => {
  const { effectiveUserId, effectiveUserName } = useAuth();
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');

  // AI Generator state
  const [aiTopic, setAiTopic] = useState('');
  const [aiLanguage, setAiLanguage] = useState<QuizLanguage>('bn');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiIncludeMath, setAiIncludeMath] = useState<boolean>(false); // default off, user adds if they want
  const [aiCategory, setAiCategory] = useState<string>(categories[0]?.name || 'General');
  const [aiCustomNotes, setAiCustomNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual & Generated Quiz Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(categories[0]?.name || 'General');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [language, setLanguage] = useState<QuizLanguage>('bn');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(10);
  const [isPublic, setIsPublic] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: `q-${Date.now()}-1`,
      prompt: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: '',
      hasMath: false,
    },
  ]);
  const [previewMathMode, setPreviewMathMode] = useState(true);
  const [publishError, setPublishError] = useState<string | null>(null);

  const handleGenerateWithAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      setAiError('Please enter a topic or subject.');
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          language: aiLanguage,
          difficulty: aiDifficulty,
          questionCount: aiCount,
          includeMath: aiIncludeMath,
          customPrompt: aiCustomNotes.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quiz');
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions returned by AI');
      }

      // Populate form
      setTitle(aiTopic.trim());
      setDescription(
        `Quiz covering ${aiTopic.trim()} in ${
          aiLanguage === 'bn' ? 'বাংলা' : aiLanguage.toUpperCase()
        }.`
      );
      setCategory(aiCategory || 'General');
      setLanguage(aiLanguage);
      setQuestions(data.questions);
      setActiveTab('manual'); // Switch to review & edit tab!
    } catch (err: unknown) {
      console.error('AI Gen Error:', err);
      const msg = err instanceof Error ? err.message : 'Error calling Gemini AI';
      setAiError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${prev.length + 1}`,
        prompt: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: '',
        hasMath: previewMathMode,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (
    index: number,
    field: keyof Question,
    value: any
  ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const newOpts = [...copy[qIndex].options];
      newOpts[optIndex] = value;
      copy[qIndex] = { ...copy[qIndex], options: newOpts };
      return copy;
    });
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setPublishError(null);

    if (!title.trim()) {
      setPublishError('Please enter a quiz title.');
      return;
    }

    const finalCategory = customCategoryInput.trim() || category || 'General';

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setPublishError(`Question #${i + 1} has an empty question prompt.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j] || !q.options[j].trim()) {
          setPublishError(`Question #${i + 1} has empty option ${['A', 'B', 'C', 'D'][j]}.`);
          return;
        }
      }
    }

    const shareCode = generateShareCode(finalCategory.slice(0, 4).toUpperCase() || 'QZ');

    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim() || `Quiz on ${finalCategory}`,
      language,
      category: finalCategory,
      creatorId: effectiveUserId,
      creatorName: effectiveUserName,
      shareCode,
      timeLimitMinutes,
      isPublic,
      questionsCount: questions.length,
      questions: questions.map((q) => ({
        ...q,
        hasMath: q.prompt.includes('$') || q.options.some((o) => o.includes('$')),
      })),
      playsCount: 0,
      hasMath: questions.some((q) => q.prompt.includes('$') || q.options.some((o) => o.includes('$'))),
      createdAt: new Date().toISOString(),
    };

    onQuizCreated(newQuiz);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Studio Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">Quiz Creation Studio</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build quizzes for your subject manually or generate using Gemini AI.
          </p>
        </div>

        {/* Tab Switch */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Quiz Generator</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'manual'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manual Editor ({questions.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI GENERATOR */}
      {activeTab === 'ai' && (
        <form onSubmit={handleGenerateWithAi} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Prompt Gemini AI to Generate MCQs</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Type any topic or syllabus. AI will generate questions, options, and full step-by-step solutions for your students.
            </p>
          </div>

          {aiError && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Topic input */}
          <div>
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
              Topic or Subject Matter <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g. বাংলা ব্যাকরণ ও পদ প্রকরণ, World History, Organic Chemistry, or any topic..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Category</span>
                <button
                  type="button"
                  onClick={onOpenCategories}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  + Add
                </button>
              </label>
              <select
                value={aiCategory}
                onChange={(e) => setAiCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Language</span>
              </label>
              <select
                value={aiLanguage}
                onChange={(e) => setAiLanguage(e.target.value as QuizLanguage)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="bn">বাংলা (Bengali)</option>
                <option value="en">English</option>
                <option value="es">Español (Spanish)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="fr">Français (French)</option>
                <option value="ar">العربية (Arabic)</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Difficulty Level
              </label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="easy">Easy (সহজ)</option>
                <option value="medium">Medium (মাঝারি)</option>
                <option value="hard">Hard (কঠিন)</option>
              </select>
            </div>

            {/* Question count */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Questions Count
              </label>
              <select
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
              </select>
            </div>
          </div>

          {/* Math formula toggle (optional) */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-purple-400 font-bold text-xs bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30">
                {"LaTeX"}
              </span>
              <div>
                <p className="text-xs font-bold text-white">Include LaTeX Formulas (If Math / Physics subject)</p>
                <p className="text-[11px] text-slate-400">
                  Toggle on only if your subject requires mathematical equations and formulas.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={aiIncludeMath}
              onChange={(e) => setAiIncludeMath(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Custom syllabus notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Optional Syllabus / Instructions:
            </label>
            <textarea
              rows={2}
              value={aiCustomNotes}
              onChange={(e) => setAiCustomNotes(e.target.value)}
              placeholder="e.g. Include specific questions from Chapter 4, focus on definitions and applications..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini is Crafting MCQs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Quiz with AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: MANUAL EDITOR / REVIEW GENERATED */}
      {activeTab === 'manual' && (
        <form onSubmit={handlePublish} className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Quiz Details & Subject Settings</span>
            </h2>

            {publishError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{publishError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Quiz Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. বাংলা ব্যাকরণ কুইজ, Accounting Chapter 1..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Subject / Category
                  </label>
                  <button
                    type="button"
                    onClick={onOpenCategories}
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    <span>Manage Categories</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="custom">+ Type New Subject</option>
                  </select>

                  {category === 'custom' && (
                    <input
                      type="text"
                      required
                      placeholder="Subject name"
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-indigo-500 rounded-xl text-xs text-white focus:outline-none"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as QuizLanguage)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="bn">বাংলা (Bangla)</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="hi">हिन्दी</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Time Limit (Minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  placeholder="0 = Untimed"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4 pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={previewMathMode}
                    onChange={(e) => setPreviewMathMode(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span>Live Preview Mode</span>
                </label>
              </div>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Questions ({questions.length})
              </h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 relative"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      Question #{qIdx + 1}
                    </span>
                  </div>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Question Text
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={q.prompt}
                    onChange={(e) => handleQuestionChange(qIdx, 'prompt', e.target.value)}
                    placeholder="Enter question prompt here..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  {previewMathMode && q.prompt.trim() && (
                    <div className="mt-1.5 p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-indigo-300">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Preview:</span>
                      <MathRenderer content={q.prompt} />
                    </div>
                  )}
                </div>

                {/* 4 Choices */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Options (Select the radio button for the correct answer):
                  </label>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <label
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
                            q.correctOptionIndex === optIdx
                              ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                          title="Set as correct answer"
                        >
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctOptionIndex === optIdx}
                            onChange={() => handleQuestionChange(qIdx, 'correctOptionIndex', optIdx)}
                            className="sr-only"
                          />
                          {['A', 'B', 'C', 'D'][optIdx]}
                        </label>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                          placeholder={`Option ${['A', 'B', 'C', 'D'][optIdx]}`}
                          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        {previewMathMode && opt.includes('$') && (
                          <div className="hidden sm:block max-w-[120px] truncate text-xs text-indigo-300 px-2 py-1 bg-slate-950 rounded border border-slate-800">
                            <MathRenderer content={opt} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Solution Explanation */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Explanation for Wrong Answer Reviews:
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation}
                    onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                    placeholder="Step-by-step reasoning for students..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  {previewMathMode && q.explanation && (
                    <div className="mt-1 p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-300">
                      <MathRenderer content={q.explanation} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Publish Quiz & Get Share Link</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
