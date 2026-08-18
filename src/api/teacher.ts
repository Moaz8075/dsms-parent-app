import { apiFetch } from './client';

const BASE = '/teachers/me';

function qs(params: Record<string, string | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function unwrap<T>(path: string, options?: RequestInit & { subdomain?: string | null }) {
  const response = await apiFetch<{ success: boolean; data: T }>(path, options);
  return response.data;
}

export async function fetchTeacherDashboard() {
  return unwrap<any>(`${BASE}/dashboard`);
}

export async function fetchTeacherClasses() {
  return unwrap<{
    classes: {
      id: string;
      classId: string;
      subjectId: string;
      grade: string;
      title: string;
      students: number;
      room: string;
      nextSession?: { when: string; topic: string };
    }[];
    total: number;
  }>(`${BASE}/classes`);
}

export async function fetchTeacherStudents() {
  return unwrap<{
    stats: {
      atRisk: number;
      topPerformers: number;
      avgAttendance: number;
      ungradedSubmissions: number;
      total: number;
    };
    students: {
      key: string;
      studentId: string;
      name: string;
      id: string;
      grade: string;
      attendance: number;
      gradeLetter: string;
      status: string;
      avatar: string;
    }[];
  }>(`${BASE}/students`);
}

export async function fetchTeacherSchedule() {
  return unwrap<{
    slots: {
      key: string;
      dayOfWeek: number;
      day: string;
      startTime: string;
      endTime: string;
      subject: string;
      className: string;
      gradeLabel: string;
      room: string;
    }[];
  }>(`${BASE}/schedule`);
}

export async function fetchTeacherDiary(params?: { classId?: string; from?: string; to?: string }) {
  return unwrap<{
    entries: {
      id: string;
      classId: string;
      className: string;
      gradeLabel: string;
      entryDate: string;
      title: string;
      content?: string;
      attachments?: { fileName: string; fileUrl: string; mimeType?: string; size?: number }[];
    }[];
    classes: { classId: string; className: string; gradeLabel: string }[];
  }>(`${BASE}/diary${qs(params ?? {})}`);
}

export async function createTeacherDiary(payload: {
  classId: string;
  entryDate: string;
  title: string;
  content?: string;
}) {
  return unwrap<any>(`${BASE}/diary`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchTeacherStudentAttendance(studentId: string, month: string) {
  return unwrap<{
    studentId: string;
    studentName: string;
    className: string;
    month: string;
    summary: { total: number; present: number; absent: number; late: number; rate: number };
    records: { date: string; status: string; notes: string }[];
  }>(`${BASE}/students/${studentId}/attendance${qs({ month })}`);
}

export async function fetchTeacherStudentReportCard(studentId: string) {
  return unwrap<any>(`${BASE}/students/${studentId}/report-card`);
}

export async function fetchStudentProfile(studentId: string) {
  return unwrap<any>(`/students/${studentId}`);
}

export async function fetchTeacherAttendanceClasses(date?: string) {
  return unwrap<{
    date: string;
    dateLabel: string;
    classes: {
      id: string;
      name: string;
      gradeLabel: string;
      room: string;
      totalStudents: number;
      markedToday: number;
      isComplete: boolean;
    }[];
  }>(`${BASE}/attendance/classes${qs({ date })}`);
}

export async function fetchTeacherAttendanceSheet(classId: string, date?: string) {
  return unwrap<{
    class: { id: string; name: string; gradeLabel: string; room: string };
    date: string;
    dateLabel: string;
    students: {
      key: string;
      studentId: string;
      rollNumber: string;
      name: string;
      initials: string;
      status: string | null;
      notes: string;
      isMarked: boolean;
    }[];
    summary: {
      total: number;
      marked: number;
      unmarked: number;
      present: number;
      absent: number;
      late: number;
    };
  }>(`${BASE}/attendance/sheet${qs({ classId, date })}`);
}

export async function saveTeacherAttendance(payload: {
  classId: string;
  date: string;
  records: { studentId: string; status: string; notes?: string }[];
}) {
  return unwrap<{ saved: number; date: string; classId: string }>(`${BASE}/attendance`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchTeacherTestsAndMarks() {
  return unwrap<{
    termLabel: string;
    summary: { incomplete: number; unmarkedStudents: number; completed: number; total: number };
    incomplete: TestCard[];
    completed: TestCard[];
  }>(`${BASE}/tests-and-marks`);
}

export type TestCard = {
  key: string;
  examSubjectId: string;
  classId: string;
  subjectId: string;
  classLabel: string;
  subject: string;
  testName: string;
  testType: string;
  examDate: string;
  examDateRaw?: string;
  maxMarks: number;
  passingMarks: number;
  totalStudents: number;
  markedCount: number;
  unmarkedCount: number;
  markStatus: string;
  submittedToAdmin: boolean;
};

export async function fetchCreateTestOptions() {
  return unwrap<{
    academicYear: string;
    examTypes: { value: string; label: string }[];
    classSubjects: {
      key: string;
      classId: string;
      subjectId: string;
      label: string;
      room: string;
    }[];
    defaults: { maxMarks: number; passingMarks: number };
  }>(`${BASE}/tests-and-marks/options`);
}

export async function createTeacherTest(payload: {
  name: string;
  type: string;
  classId: string;
  subjectId: string;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  description?: string;
}) {
  return unwrap<any>(`${BASE}/tests-and-marks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchTeacherMarkSheet(examSubjectId: string) {
  return unwrap<{
    header: {
      classLabel: string;
      subject: string;
      testName: string;
      testType: string;
      examDate: string;
      termLabel: string;
      maxMarks: number;
      passingMarks: number;
    };
    rows: {
      key: string;
      studentId: string;
      rollNumber: string;
      name: string;
      marksObtained: number | null;
      marksDisplay: string;
      grade: string;
      isAbsent: boolean;
      remarks: string;
      passed: boolean;
    }[];
    summary: { total: number; marked: number; unmarked: number; absent: number; belowPassing: number };
  }>(`${BASE}/tests-and-marks/${examSubjectId}/marksheet`);
}

export async function saveTeacherMarkSheet(payload: {
  examSubjectId: string;
  records: { studentId: string; marksObtained?: number | null; isAbsent?: boolean; remarks?: string }[];
}) {
  return unwrap<{ saved: number; examSubjectId: string }>(`${BASE}/tests-and-marks/marksheet`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchTeacherAnnouncements(tab = 'active') {
  return unwrap<{
    items: {
      id: string;
      title: string;
      content?: string;
      category: string;
      status: string;
      authorName: string;
      publishedAt: string | null;
    }[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
    tabCounts: { active: number; drafts: number; archive: number };
  }>(`/announcements${qs({ tab, page: '1', pageSize: '20' })}`);
}

export async function fetchAnnouncementOptions() {
  return unwrap<{
    categories?: { value: string; label: string }[];
    classes?: { id: string; name: string }[];
  }>('/announcements/options');
}

export async function createTeacherAnnouncement(payload: {
  title: string;
  content: string;
  category: string;
  publishMode: 'draft' | 'publish';
  targets: { targetType: string; targetId?: string }[];
}) {
  return unwrap<any>('/announcements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCommunicationContacts() {
  return unwrap<{
    contacts: { id: string; name: string; email?: string; role: string; avatarUrl?: string | null }[];
  }>('/communication/contacts');
}
