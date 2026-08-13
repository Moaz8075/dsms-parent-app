export type ParentChild = {
  childId: string;
  name: string;
  schoolId: string;
  schoolName: string;
  subdomain: string | null;
  grade: string;
  className?: string;
  relationship?: string;
  isPrimary?: boolean;
  attendance?: number;
  gradeLetter?: string;
  avatarUrl?: string | null;
  initials?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  avatarUrl?: string | null;
  phone?: string | null;
  onboardingCompletedAt?: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  role: { id?: string; name?: string; code?: string } | null;
  permissions: string[];
  children: ParentChild[];
  activeChildId: string | null;
};

export type DiaryItem = {
  type: 'assignment' | 'announcement' | 'diary';
  title: string;
  childId: string;
  childName: string;
  schoolName: string;
  category?: string;
  dueAt?: string;
  content?: string;
  attachments?: FileAttachment[];
};

export type FileAttachment = {
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  size?: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  dueDate: string | null;
  issuedAt: string | null;
  items: { description: string; amount: number }[];
  payments: {
    id: string;
    amount: number;
    status: string;
    paidAt: string | null;
    notes?: string | null;
    receipts: FileAttachment[];
  }[];
};

export type LeaveRequest = {
  id: string;
  childId: string;
  childName: string;
  schoolName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  reviewNote?: string | null;
  createdAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  category?: string;
  authorName?: string;
  publishedAt: string | null;
};

export type AttendanceRecord = {
  date: string;
  status: string;
  notes: string;
};

export type ExamRow = {
  key: string;
  examId: string;
  examName: string;
  examType: string;
  examDate: string | null;
  percentage: number | null;
  subjectCount: number;
  totalMarks?: number;
  obtainedMarks?: number;
  examAttachments?: FileAttachment[];
  subjects: {
    key: string;
    subject: string;
    marks: number | null;
    maxMarks: number;
    grade: string;
    isAbsent: boolean;
    percentage: number | null;
    remarks?: string | null;
    attachments?: FileAttachment[];
  }[];
};

export type TeacherContact = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  isPrimary?: boolean;
  isClassTeacher?: boolean;
  roleLabel?: string;
  subjects?: string[];
};
