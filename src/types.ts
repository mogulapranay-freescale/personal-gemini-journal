export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastActiveAt: string;
}

export type ReflectionMode = 'reflect' | 'summarize' | 'brainstorm';

export interface ChatMessage {
  id: string;
  reflectionId: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  mode?: ReflectionMode;
  timestamp: string;
}

export interface JournalReflection {
  id: string;
  userId: string;
  title: string;
  category: 'Daily Log' | 'Deep Reflection' | 'Idea Brainstorm' | 'Work & Focus' | 'Mindfulness';
  initialPrompt: string;
  summary: string;
  brainstormIdeas: string[];
  keyInsights: string[];
  turnCount: number;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface GenerateGeminiRequest {
  prompt: string;
  mode: ReflectionMode;
  contextHistory?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
  entryTitle?: string;
}

export interface GenerateGeminiResponse {
  reply: string;
  summary?: string;
  brainstormIdeas?: string[];
  keyInsights?: string[];
  suggestedFollowUps?: string[];
  modelUsed: string;
}
