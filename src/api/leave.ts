import { apiFetch } from './client';
import type { TeacherLeaveRequest } from '../types';

function qs(params: Record<string, string | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function fetchStaffLeaveRequests(status = 'PENDING') {
  const response = await apiFetch<{ success: boolean; data: { requests: TeacherLeaveRequest[] } }>(
    `/leave-requests${qs({ status: status === 'all' ? undefined : status })}`,
  );
  return response.data;
}

export async function reviewLeaveRequest(payload: {
  id: string;
  status: 'APPROVED' | 'REJECTED';
  reviewNote?: string;
}) {
  const { id, ...body } = payload;
  const response = await apiFetch<{ success: boolean; data: { id: string; status: string } }>(
    `/leave-requests/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
  return response.data;
}
