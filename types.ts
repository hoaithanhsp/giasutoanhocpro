
export type EducationLevel = 'primary' | 'middle' | 'high';

export type Difficulty = 'recognition' | 'understanding' | 'application';

export type DifficultyMode = 'mixed' | 'recognition' | 'understanding' | 'application';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string; // "A", "B", "C", or "D"
  explanation: string;
  difficulty: Difficulty;
  difficultyLabel: string;
}

export interface QuizState {
  status: 'setup' | 'loading' | 'active' | 'finished';
  level: EducationLevel;
  grade: number;
  topic: string;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<string, string>; // questionId -> answer (e.g., "A")
  score: number;
  startTime: number;
  endTime: number | null;
}

export interface GradeConfig {
  grade: number;
  label: string;
  topics: string[];
}

export interface ThemeConfig {
  bg: string;
  primary: string;
  primaryHover: string;
  text: string;
  border: string;
  badge: string;
  gradient: string;
}

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  color: string;
  textColor: string;
}

export interface QuizResult {
  id: string;
  date: number;
  grade: number;
  topic: string;
  score: number;
  totalQuestions: number;
  level: EducationLevel;
}

export interface StudentInfo {
  name: string;
  className: string; // "10A1", "6B"...
}

export interface SheetQuizResult {
  timestamp: string;
  studentName: string;
  studentClass: string;
  level: string;
  grade: number;
  topic: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  scorePercent: number;
  timeTakenSeconds: number;
  details: { questionIndex: number; correct: boolean; difficulty: string }[];
}
