import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  cancelLeaveRequest,
  createLeaveRequest,
  fetchAcademics,
  fetchAnnouncements,
  fetchAttendance,
  fetchChildren,
  fetchDashboard,
  fetchDiary,
  fetchFees,
  fetchLeaveRequests,
  fetchReportCard,
  fetchTeachers,
  submitPaymentReceipt,
} from '../api/parent';
import { completeParentOnboarding, fetchParentOnboarding, updateParentProfile } from '../api/auth';
import { addDays, isoDate } from '../utils/format';

export function useParentChildren() {
  const { isAuthenticated, syncChildren } = useAuth();
  return useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => {
      const data = await fetchChildren();
      if (data.children?.length) syncChildren(data.children);
      return data;
    },
    enabled: isAuthenticated,
  });
}

export function useParentDashboard(childId?: string | null) {
  return useQuery({
    queryKey: ['parent-dashboard', childId],
    queryFn: () => fetchDashboard(childId),
    enabled: Boolean(childId),
  });
}

export function useParentDiary(childId?: string | null) {
  return useQuery({
    queryKey: ['parent-diary', childId],
    queryFn: () =>
      fetchDiary({
        childId,
        from: addDays(isoDate(), -14),
        to: addDays(isoDate(), 21),
      }),
    enabled: Boolean(childId),
  });
}

export function useParentAttendance(childId?: string | null, from?: string, to?: string) {
  return useQuery({
    queryKey: ['parent-attendance', childId, from, to],
    queryFn: () => fetchAttendance(childId as string, from, to),
    enabled: Boolean(childId),
  });
}

export function useParentAcademics(childId?: string | null) {
  return useQuery({
    queryKey: ['parent-academics', childId],
    queryFn: () => fetchAcademics(childId as string),
    enabled: Boolean(childId),
  });
}

export function useParentReportCard(childId?: string | null) {
  return useQuery({
    queryKey: ['parent-report-card', childId],
    queryFn: () => fetchReportCard(childId as string),
    enabled: Boolean(childId),
  });
}

export function useParentAnnouncements(childId?: string | null) {
  return useQuery({
    queryKey: ['parent-announcements', childId],
    queryFn: () => fetchAnnouncements(childId as string),
    enabled: Boolean(childId),
  });
}

export function useParentLeaveRequests() {
  return useQuery({
    queryKey: ['parent-leave-requests'],
    queryFn: fetchLeaveRequests,
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent-leave-requests'] }),
  });
}

export function useCancelLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelLeaveRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent-leave-requests'] }),
  });
}

export function useParentTeachers(childId?: string | null) {
  return useQuery({
    queryKey: ['parent-teachers', childId],
    queryFn: () => fetchTeachers(childId as string),
    enabled: Boolean(childId),
  });
}

export function useParentFees(childId?: string | null) {
  return useQuery({
    queryKey: ['parent-fees', childId],
    queryFn: () => fetchFees(childId as string),
    enabled: Boolean(childId),
  });
}

export function useSubmitPaymentReceipt(childId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof submitPaymentReceipt>[1]) =>
      submitPaymentReceipt(childId as string, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent-fees', childId] }),
  });
}

export function useParentOnboarding() {
  return useQuery({
    queryKey: ['parent-onboarding'],
    queryFn: fetchParentOnboarding,
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeParentOnboarding,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent-onboarding'] }),
  });
}

export function useUpdateParentProfile() {
  return useMutation({
    mutationFn: updateParentProfile,
  });
}
