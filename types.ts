export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PUBLIC = 'PUBLIC',
  GUEST = 'GUEST'
}

export interface Student {
  id: string;
  regNo: string;
  name: string;
  classId: string;
  dob: string; // YYYY-MM-DD
  fatherName: string;
  motherName: string;
  photoUrl?: string;
  password?: string; // In real app, hashed
}

export interface SubjectConfig {
  name: string;
  maxMarks: number;
}

export interface ClassData {
  id: string;
  name: string;
  teacherId: string;
  password?: string;
  subjects: SubjectConfig[];
}

export interface Marks {
  studentId: string;
  subjects: Record<string, number>; // { "Maths": 90, "English": 85 }
  total: number;
  grade: string;
  term: 'Term 1' | 'Term 2';
}

export interface ProfileRequest {
  id: string;
  studentId: string;
  studentName?: string; // UI helper
  regNo?: string;       // UI helper
  field: string;
  oldValue?: string;
  newValue: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

export interface SchoolConfig {
  schoolName: string;
  sheetUrl: string;
  licenseKey: string;
  isPro: boolean;
  themeColor: string;
}