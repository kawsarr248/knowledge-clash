import React, { useState } from 'react';
import { Quiz } from '../types/quiz';
import { MathRenderer } from './MathRenderer';
import { X, Copy, Check, Share2, Link, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  quiz: Quiz | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ quiz, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!quiz) return null;

  // Direct share link with no PIN needed
  const directQuizUrl = `${window.location.origin}/?quiz=${encodeURIComponent(quiz.id)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(directQuizUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      console.warn('Copy error', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Share Quiz with Students</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close share dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Quiz Title:
          </span>
          <h4 className="text-sm sm:text-base font-bold text-white mt-0.5 line-clamp-2">
            <MathRenderer content={quiz.title} />
          </h4>
          <span className="text-xs text-indigo-400 mt-1 inline-block">
            {quiz.questionsCount || quiz.questions.length} Questions • Subject: {quiz.category || 'General'}
          </span>
        </div>

        {/* Direct Link Box - No PIN needed */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-indigo-400" />
              <span>Direct Student Test Link</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              No PIN needed
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={directQuizUrl}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none truncate select-all"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-md active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Students click this link to directly start this test immediately. Test scores and wrong answers will be tracked in their summary dashboard.
          </p>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
