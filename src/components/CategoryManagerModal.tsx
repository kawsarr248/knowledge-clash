import React, { useState } from 'react';
import { Category } from '../types/quiz';
import { saveCategory, deleteCategory } from '../services/quizService';
import { useAuth } from '../context/AuthContext';
import {
  FolderPlus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Tag,
  ShieldCheck,
} from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCategoriesUpdated: (categories: Category[]) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesUpdated,
}) => {
  const { effectiveUserId, isTeacher } = useAuth();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A category with this name already exists.');
      return;
    }

    const newCat: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      createdBy: effectiveUserId,
      createdAt: new Date().toISOString(),
    };

    await saveCategory(newCat);
    onCategoriesUpdated([...categories, newCat]);
    setNewCategoryName('');
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const handleSaveEdit = async (cat: Category) => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    const updated: Category = { ...cat, name: trimmed };
    await saveCategory(updated);
    onCategoriesUpdated(categories.map((c) => (c.id === cat.id ? updated : c)));
    setEditingId(null);
  };

  const handleDelete = async (catId: string) => {
    await deleteCategory(catId);
    onCategoriesUpdated(categories.filter((c) => c.id !== catId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Manage Subject Categories</span>
                {isTeacher && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Teacher Mode
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Add, rename, or delete categories according to your syllabus & subjects.
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

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Add new Category */}
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g. বাংলা ১ম পত্র, Chemistry, World History..."
            className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </form>

        {/* Categories List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No categories configured yet. Add your first subject above!
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl gap-2 transition-all hover:border-slate-700"
              >
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-slate-900 border border-indigo-500 rounded-lg text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveEdit(cat)}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-lg"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="text-xs sm:text-sm font-semibold text-white truncate">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-850 rounded-lg transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-850 rounded-lg transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {categories.length} active subject categories
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
