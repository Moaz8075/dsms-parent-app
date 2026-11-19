import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { createComplaint, fetchComplaint, fetchComplaints, replyToComplaint } from '../api/complaints';

export function useComplaints() {
  const { isTeacher: teacher, isStudent } = useAuth();
  const isTeacher = teacher || isStudent; // teachers and students use the personal (non-parent) complaint endpoints
  return useQuery({ queryKey: ['complaints', isTeacher], queryFn: () => fetchComplaints(isTeacher) });
}

export function useComplaint(id?: string) {
  const { isTeacher: teacher, isStudent } = useAuth();
  const isTeacher = teacher || isStudent; // teachers and students use the personal (non-parent) complaint endpoints
  return useQuery({ queryKey: ['complaint', isTeacher, id], queryFn: () => fetchComplaint(isTeacher, id as string), enabled: Boolean(id) });
}

export function useCreateComplaint() {
  const { isTeacher: teacher, isStudent } = useAuth();
  const isTeacher = teacher || isStudent; // teachers and students use the personal (non-parent) complaint endpoints
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { subject: string; description: string; category: string; childId?: string }) => createComplaint(isTeacher, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  });
}

export function useReplyToComplaint() {
  const { isTeacher: teacher, isStudent } = useAuth();
  const isTeacher = teacher || isStudent; // teachers and students use the personal (non-parent) complaint endpoints
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => replyToComplaint(isTeacher, id, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaints'] });
      qc.invalidateQueries({ queryKey: ['complaint'] });
    },
  });
}
