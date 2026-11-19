import { apiFetch } from './client';

export const COMPLAINT_CATEGORIES = [
  { value: 'ACADEMIC', label: 'Academics / teaching' },
  { value: 'TEACHER_OR_STAFF', label: 'A teacher or staff member' },
  { value: 'FEES', label: 'Fees & billing' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'FACILITIES', label: 'Facilities & cleanliness' },
  { value: 'SAFETY', label: 'Safety & security' },
  { value: 'BEHAVIOUR', label: 'Behaviour / bullying' },
  { value: 'OTHER', label: 'Something else' },
] as const;

export type ComplaintStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

export type ComplaintMessage = {
  id: string;
  authorName: string;
  authorRole: 'SUBMITTER' | 'STAFF';
  message: string;
  createdAt: string;
};

export type Complaint = {
  id: string;
  complaintNumber: string;
  subject: string;
  description: string;
  category: string;
  categoryLabel: string;
  status: ComplaintStatus;
  studentName: string | null;
  resolutionNote: string | null;
  createdLabel: string;
  messageCount?: number;
  messages: ComplaintMessage[];
};

/** Parents use /parents/me/complaints; teachers use /my-complaints. */
const base = (teacher: boolean) => (teacher ? '/my-complaints' : '/parents/me/complaints');

export async function fetchComplaints(teacher: boolean) {
  const r = await apiFetch<{ success: boolean; data: Complaint[] }>(base(teacher));
  return r.data;
}

export async function fetchComplaint(teacher: boolean, id: string) {
  const r = await apiFetch<{ success: boolean; data: Complaint }>(`${base(teacher)}/${id}`);
  return r.data;
}

export async function createComplaint(
  teacher: boolean,
  input: { subject: string; description: string; category: string; childId?: string },
) {
  const r = await apiFetch<{ success: boolean; data: Complaint }>(base(teacher), {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return r.data;
}

export async function replyToComplaint(teacher: boolean, id: string, message: string) {
  const r = await apiFetch<{ success: boolean; data: Complaint }>(`${base(teacher)}/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  return r.data;
}
