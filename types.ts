
export enum AppView {
  LOGIN = 'LOGIN',
  HOME = 'HOME',
  LESSON_LIST = 'LESSON_LIST',
  READING = 'READING',
  WRITING = 'WRITING',
  CREATIVE = 'CREATIVE',
  CHAT = 'CHAT',
  EXERCISE = 'EXERCISE',
  TEACHER_DASHBOARD = 'TEACHER_DASHBOARD',
  PARENT_DASHBOARD = 'PARENT_DASHBOARD'
}

export type UserRole = 'teacher' | 'student' | null;

export interface AppTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  backgroundImage?: string;
}

export interface Classroom {
  id: string;
  name: string;
  grade: string;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  avatarColor: string;
  avatarIcon?: string;
}

export interface ProgressRecord {
  id: string;
  studentId?: string;
  studentName?: string;
  lessonId: string;
  lessonTitle: string;
  activityType: 'reading' | 'writing' | 'exercise';
  score: number;
  comment: string;
  timestamp: number;
  audioUrl?: string;
  audioBase64?: string;
}

export interface MatchingPair {
  id: string;
  word: string;
  targetValue: string;
  type: 'sound' | 'image';
}

export interface Exercise {
  id: string;
  type: 'selection' | 'matching' | 'word_finding' | 'riddle';
  question: string;
  hint?: string;
  options?: string[];
  correctAnswer?: string;
  expectedConcept: string;
  matchingPairs?: MatchingPair[];
}

export interface LessonContent {
  sounds?: string[];
  words?: string[];
  sentences?: string[];
  paragraphs?: string[];
  exercises?: Exercise[];
  pronunciationOverrides?: { [key: string]: string }; // key: từ hiển thị, value: từ để đọc
}

export interface Lesson {
  id: string;
  title: string;
  pageNumber: number;
  volume: 1 | 2;
  type: 'alphabet' | 'syllable' | 'story' | 'review';
  content: LessonContent;
}

export type WritingCategory = 'Chữ cái' | 'Vần' | 'Từ ngữ';

export interface WritingExercise {
  id: string;
  category: WritingCategory;
  label: string;
  text: string;
  videoUrl?: string;
}

export interface CreativeProject {
  id: string;
  type: 'image' | 'video' | 'edit';
  prompt: string;
  resultUrl: string;
  timestamp: number;
}
