import { Quiz, Category } from '../types/quiz';

// Empty default seed quizzes as requested by the user ("i will add... i can create any quiz")
export const SEED_QUIZZES: Quiz[] = [];

// Initial customizable categories list that teacher can add to, edit, or delete
export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-general',
    name: 'General',
    description: 'General subject topics',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
];
