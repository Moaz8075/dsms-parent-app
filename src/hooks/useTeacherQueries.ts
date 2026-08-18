import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../api/auth';
import {
  createTeacherAnnouncement,
  createTeacherDiary,
  createTeacherTest,
  fetchAnnouncementOptions,
  fetchCommunicationContacts,
  fetchCreateTestOptions,
  fetchStudentProfile,
  fetchTeacherAnnouncements,
  fetchTeacherAttendanceClasses,
  fetchTeacherAttendanceSheet,
  fetchTeacherClasses,
  fetchTeacherDashboard,
  fetchTeacherDiary,
  fetchTeacherMarkSheet,
  fetchTeacherSchedule,
  fetchTeacherStudentAttendance,
  fetchTeacherStudentReportCard,
  fetchTeacherStudents,
  fetchTeacherTestsAndMarks,
  saveTeacherAttendance,
  saveTeacherMarkSheet,
} from '../api/teacher';

export function useTeacherDashboard() {
  const { isAuthenticated, isTeacher } = useAuth();
  return useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: fetchTeacherDashboard,
    enabled: isAuthenticated && isTeacher,
  });
}

export function useTeacherClasses() {
  return useQuery({
    queryKey: ['teacher-classes'],
    queryFn: fetchTeacherClasses,
  });
}

export function useTeacherStudents() {
  return useQuery({
    queryKey: ['teacher-students'],
    queryFn: fetchTeacherStudents,
  });
}

export function useTeacherSchedule() {
  return useQuery({
    queryKey: ['teacher-schedule'],
    queryFn: fetchTeacherSchedule,
  });
}

export function useTeacherDiary(params?: { classId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['teacher-diary', params?.classId, params?.from, params?.to],
    queryFn: () => fetchTeacherDiary(params),
  });
}

export function useCreateTeacherDiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTeacherDiary,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-diary'] });
      qc.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
}

export function useTeacherStudentAttendance(studentId?: string, month?: string) {
  return useQuery({
    queryKey: ['teacher-student-attendance', studentId, month],
    queryFn: () => fetchTeacherStudentAttendance(studentId as string, month as string),
    enabled: Boolean(studentId && month),
  });
}

export function useTeacherStudentReportCard(studentId?: string) {
  return useQuery({
    queryKey: ['teacher-student-report-card', studentId],
    queryFn: () => fetchTeacherStudentReportCard(studentId as string),
    enabled: Boolean(studentId),
  });
}

export function useStudentProfile(studentId?: string) {
  return useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: () => fetchStudentProfile(studentId as string),
    enabled: Boolean(studentId),
  });
}

export function useTeacherAttendanceClasses(date?: string) {
  return useQuery({
    queryKey: ['teacher-attendance-classes', date],
    queryFn: () => fetchTeacherAttendanceClasses(date),
  });
}

export function useTeacherAttendanceSheet(classId?: string, date?: string) {
  return useQuery({
    queryKey: ['teacher-attendance-sheet', classId, date],
    queryFn: () => fetchTeacherAttendanceSheet(classId as string, date),
    enabled: Boolean(classId),
  });
}

export function useSaveTeacherAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveTeacherAttendance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-attendance-classes'] });
      qc.invalidateQueries({ queryKey: ['teacher-attendance-sheet'] });
      qc.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
}

export function useTeacherTestsAndMarks() {
  return useQuery({
    queryKey: ['teacher-tests-and-marks'],
    queryFn: fetchTeacherTestsAndMarks,
  });
}

export function useCreateTestOptions() {
  return useQuery({
    queryKey: ['teacher-create-test-options'],
    queryFn: fetchCreateTestOptions,
  });
}

export function useCreateTeacherTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTeacherTest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-tests-and-marks'] });
      qc.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
}

export function useTeacherMarkSheet(examSubjectId?: string) {
  return useQuery({
    queryKey: ['teacher-mark-sheet', examSubjectId],
    queryFn: () => fetchTeacherMarkSheet(examSubjectId as string),
    enabled: Boolean(examSubjectId),
  });
}

export function useSaveTeacherMarkSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveTeacherMarkSheet,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['teacher-tests-and-marks'] });
      qc.invalidateQueries({ queryKey: ['teacher-mark-sheet', variables.examSubjectId] });
      qc.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
}

export function useTeacherAnnouncements(tab = 'active') {
  return useQuery({
    queryKey: ['teacher-announcements', tab],
    queryFn: () => fetchTeacherAnnouncements(tab),
  });
}

export function useAnnouncementOptions() {
  return useQuery({
    queryKey: ['announcement-options'],
    queryFn: fetchAnnouncementOptions,
  });
}

export function useCreateTeacherAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTeacherAnnouncement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-announcements'] }),
  });
}

export function useTeacherContacts() {
  return useQuery({
    queryKey: ['teacher-contacts'],
    queryFn: fetchCommunicationContacts,
  });
}

export function useUpdateTeacherProfile() {
  return useMutation({
    mutationFn: updateUserProfile,
  });
}
