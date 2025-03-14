export interface TeamMember {
  firstName: string;
  lastName: string;
  grade: number;
  schoolName: string;
}

export interface Team {
  id?: string;
  teamNumber: string;
  teamName: string;
  schoolName: string;
  student1: string;
  student2: string;
  category: 'jr' | 'sr';
  status: 'registered' | 'waiting' | 'checked-in' | 'completed';
  arrivalTime?: string;
  checkInTime?: string;
  createdAt: string;
}

export interface JudgeScore {
  teamNumber: string;
  judgeId: string;
  scores: {
    criteria1: number;
    criteria2: number;
    criteria3: number;
    criteria4: number;
    criteria5: number;
  };
  comments: string;
  timestamp: string;
}

export interface TeamScore {
  teamNumber: string;
  category: 'jr' | 'sr';
  averageScores: {
    criteria1: number;
    criteria2: number;
    criteria3: number;
    criteria4: number;
    criteria5: number;
  };
  totalScore: number;
  rank?: number;
}

export type UserRole = 'volunteer' | 'judge' | 'admin';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
} 