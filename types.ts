export interface User {
  id: string;
  name: string;
  role: 'parent' | 'student';
  xp: number;
  level: number;
  streak: number;
}

export interface Topic {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  description: string;
  baseSummary?: string; // The static summary
  aiSummary?: string; // The simplified AI summary
  concepts?: string[]; // List of specific concepts for this topic
}

export type AnalogyType = 'Default' | 'Sports' | 'Dance' | 'Cooking';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  topicId: string;
  questions: QuizQuestion[];
}

export interface WeekPlan {
  weekNumber: number;
  focus: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  type: 'read' | 'quiz' | 'build';
}

// Navigation Types
export type Tab = 'home' | 'learn' | 'plan' | 'community';
