export type Role = 'student' | 'mentor' | 'admin';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export type ProblemType =
  | 'dsa'
  | 'sql'
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'react'
  | 'nodejs'
  | 'javascript'
  | 'typescript'
  | 'html-css'
  | 'bug-fixing'
  | 'debugging'
  | 'mcq'
  | 'system-design'
  | 'ai-challenge';

export type UserStatus = 'active' | 'pending' | 'suspended' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  status: UserStatus;
  collegeId?: string;
  collegeName?: string;
  branchName?: string;
  batchName?: string;
  sectionName?: string;
  joinedAt: string;
  xp: number;
  rank: number;
  streak: number;
  problemsSolved: number;
  githubUrl?: string;
  bio?: string;
}

export interface College {
  id: string;
  name: string;
  code: string;
  logo?: string;
  branches: Branch[];
}

export interface Branch {
  id: string;
  name: string;
  batches: Batch[];
}

export interface Batch {
  id: string;
  name: string;
  year: number;
  sections: string[];
  studentCount: number;
  mentorId: string;
  mentorName: string;
}

export interface Question {
  id: string;
  title: string;
  slug: string;
  type: ProblemType;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  companies: string[];
  technology: string[];
  acceptanceRate: number; // e.g. 74.2
  estimatedMinutes: number;
  maxScore?: number;
  visibility?: 'public' | 'private' | 'organization';
  status?: 'draft' | 'published' | 'archived';
  description: string;
  problemStatement?: string;
  inputFormat?: string;
  outputFormat?: string;
  notes?: string;
  topics?: string[];
  supportedLanguages?: string[];
  requirements?: string[];
  constraints?: string[];
  hints?: string[];
  editorial?: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  starterCode: Record<string, string>; // language -> template
  testCases: {
    id: string;
    input: string;
    expectedOutput: string;
    explanation?: string;
    isHidden?: boolean;
    isSample?: boolean;
    weight?: number;
  }[];
  solvedStatus?: 'unsolved' | 'attempted' | 'solved';
  isBookmarked?: boolean;
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  collegeId: string;
  collegeName: string;
  branchName: string;
  batchName: string;
  sectionName: string;
  mentorName: string;
  dueDate: string;
  questions: Question[];
  totalQuestions: number;
  submittedCount: number;
  totalStudents: number;
  status: 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'overdue';
  myGrade?: number;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'upcoming' | 'live' | 'ended';
  registeredCount: number;
  questionsCount: number;
  batchSpecific?: string; // Batch name if limited
  prizes?: string;
  isRegistered?: boolean;
}

export interface Submission {
  id: string;
  questionId: string;
  questionTitle: string;
  userId: string;
  userName: string;
  language: string;
  code: string;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  runtimeMs: number;
  memoryMb: number;
  submittedAt: string;
  testsPassed: number;
  totalTests: number;
  aiReview?: AIReviewReport;
}

export interface AIReviewReport {
  id: string;
  overallScore: number;
  metrics: {
    architecture: number;
    readability: number;
    performance: number;
    accessibility: number;
    security: number;
    optimization: number;
    naming: number;
    folderStructure: number;
    reactBestPractices: number;
  };
  summary: string;
  improvements: {
    title: string;
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    originalCodeSnippet?: string;
    suggestedCodeSnippet?: string;
  }[];
  learningResources: {
    title: string;
    url: string;
    type: 'article' | 'doc' | 'video';
  }[];
  personalizedRoadmap: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  category: 'battle' | 'dsa' | 'frontend' | 'streak' | 'ai';
  xpReward: number;
  progress: number; // 0 to 100
  isUnlocked: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'homework' | 'contest' | 'review' | 'system' | 'badge';
  link?: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress: string;
  status: 'success' | 'failed' | 'warning';
}
