import { Linking } from 'react-native';
import { apiFetch } from './client';

const BASE = '/parents/me/children';

export type Certificate = { id: string; title: string; certificateNumber: string; status: 'ISSUED' | 'REVOKED'; issuedOnLabel: string };
export type CourseRow = {
  id: string; courseName: string; courseCode: string; creditHours: number | null; programName: string | null;
  className: string; semester: number | null; isElective: boolean; teacherName: string | null;
};
export type TeacherCourse = {
  id: string; className: string; semester: number | null; courseName: string; courseCode: string; programName: string | null;
  isElective: boolean; students: number;
};
export type StaffAttendanceRecord = { id: string; date: string; status: string; checkIn: string | null; checkOut: string | null; notes: string | null };
export type StaffAttendance = {
  summary: { present: number; absent: number; late: number; excused: number; halfDay: number; total: number; rate: number };
  records: StaffAttendanceRecord[];
};

export async function fetchCertificates(childId: string) {
  const r = await apiFetch<{ data: { certificates: Certificate[] } }>(`${BASE}/${childId}/certificates`);
  return r.data.certificates;
}

export async function fetchChildCourses(childId: string) {
  return (await apiFetch<{ data: CourseRow[] }>(`${BASE}/${childId}/courses`)).data;
}

export async function fetchMyCourses() {
  return (await apiFetch<{ data: TeacherCourse[] }>('/teachers/me/courses')).data;
}

export async function fetchMyStaffAttendance(from?: string, to?: string) {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  return (await apiFetch<{ data: StaffAttendance }>(`/teachers/me/attendance-record${q.toString() ? `?${q}` : ''}`)).data;
}

/** Report card / exam report / certificate / attendance: a short-lived signed link, opened in the browser to view, print or save. */
export async function openFamilyDocument(childId: string, kind: 'report-card' | 'exam-report' | 'certificate' | 'attendance', arg = '') {
  const r = await apiFetch<{ data: { url: string } }>(`${BASE}/${childId}/documents/link`, { method: 'POST', body: JSON.stringify({ kind, arg }) });
  await Linking.openURL(r.data.url);
}
