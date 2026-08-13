import { apiFetch } from './client';
import type {
  Announcement,
  AttendanceRecord,
  DiaryItem,
  ExamRow,
  FileAttachment,
  Invoice,
  LeaveRequest,
  ParentChild,
  TeacherContact,
} from '../types';

const BASE = '/parents/me';

export async function fetchChildren() {
  const response = await apiFetch<{ success: boolean; data: { children: ParentChild[] } }>(
    `${BASE}/children`,
  );
  return response.data;
}

export async function fetchDashboard(childId?: string | null) {
  const query = childId ? `?childId=${childId}` : '';
  const response = await apiFetch<{ success: boolean; data: any }>(`${BASE}/dashboard${query}`);
  return response.data as {
    stats: { myChildren: number; avgAttendance: number; schools: number };
    children: ParentChild[];
    recentUpdates: { id: string; title: string; time: string; child: string; type: string }[];
  };
}

export async function fetchDiary(params: { childId?: string | null; from?: string; to?: string }) {
  const search = new URLSearchParams();
  if (params.childId) search.set('childId', params.childId);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  const query = search.toString();
  const response = await apiFetch<{
    success: boolean;
    data: { dates: { date: string; items: DiaryItem[] }[] };
  }>(`${BASE}/diary${query ? `?${query}` : ''}`);
  return response.data;
}

export async function fetchAttendance(childId: string, from?: string, to?: string) {
  const search = new URLSearchParams();
  if (from) search.set('from', from);
  if (to) search.set('to', to);
  const query = search.toString();
  const response = await apiFetch<{
    success: boolean;
    data: {
      className: string;
      summary: { total: number; present: number; absent: number; late: number; rate: number };
      records: AttendanceRecord[];
    };
  }>(`${BASE}/children/${childId}/attendance${query ? `?${query}` : ''}`);
  return response.data;
}

export async function fetchAcademics(childId: string) {
  const response = await apiFetch<{
    success: boolean;
    data: {
      overallPerformance: number;
      exams: ExamRow[];
      recentResults: {
        key: string;
        exam: string;
        subject: string;
        type: string;
        marks: number;
        maxMarks: number;
        grade: string;
        date: string;
      }[];
    };
  }>(`${BASE}/children/${childId}/academics`);
  return response.data;
}

export async function fetchReportCard(childId: string) {
  const response = await apiFetch<{ success: boolean; data: any }>(
    `${BASE}/children/${childId}/report-card`,
  );
  return response.data as {
    summary: {
      academicYear: string;
      className: string;
      percentage: number | null;
      rank: number | null;
      gradeLabel: string | null;
      remarks: string | null;
      generatedAt: string | null;
    } | null;
    exams: ExamRow[];
  };
}

export async function fetchAnnouncements(childId: string) {
  const response = await apiFetch<{
    success: boolean;
    data: { announcements: Announcement[] };
  }>(`${BASE}/children/${childId}/announcements`);
  return response.data;
}

export async function fetchLeaveRequests() {
  const response = await apiFetch<{ success: boolean; data: { requests: LeaveRequest[] } }>(
    `${BASE}/leave-requests`,
  );
  return response.data;
}

export async function createLeaveRequest(payload: {
  childId: string;
  startDate: string;
  endDate: string;
  reason: string;
}) {
  const response = await apiFetch(`${BASE}/leave-requests`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function cancelLeaveRequest(id: string) {
  const response = await apiFetch(`${BASE}/leave-requests/${id}/cancel`, { method: 'POST' });
  return response.data;
}

export async function fetchTeachers(childId: string) {
  const response = await apiFetch<{
    success: boolean;
    data: { className: string; teachers: TeacherContact[] };
  }>(`${BASE}/children/${childId}/teachers`);
  return response.data;
}

export async function fetchFees(childId: string) {
  const response = await apiFetch<{
    success: boolean;
    data: {
      childName: string;
      schoolName: string;
      className: string;
      summary: {
        totalBilled: number;
        totalPaid: number;
        totalDue: number;
        pendingVerification: number;
        invoiceCount: number;
      };
      invoices: Invoice[];
    };
  }>(`${BASE}/children/${childId}/fees`);
  return response.data;
}

export async function submitPaymentReceipt(
  childId: string,
  payload: {
    invoiceId: string;
    amount: number;
    notes?: string;
    receipt: FileAttachment;
  },
) {
  const response = await apiFetch(`${BASE}/children/${childId}/payment-receipts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function fetchSchedule(childId: string) {
  const response = await apiFetch<{ success: boolean; data: any }>(
    `${BASE}/children/${childId}/schedule`,
  );
  return response.data;
}
