import { useQuery } from '@tanstack/react-query';
import { fetchCertificates, fetchChildCourses, fetchMyCourses, fetchMyStaffAttendance } from '../api/family';

export const useCertificates = (childId?: string | null) =>
  useQuery({ queryKey: ['certificates', childId], queryFn: () => fetchCertificates(childId as string), enabled: Boolean(childId) });
export const useChildCourses = (childId?: string | null) =>
  useQuery({ queryKey: ['child-courses', childId], queryFn: () => fetchChildCourses(childId as string), enabled: Boolean(childId) });
export const useMyCourses = () => useQuery({ queryKey: ['my-courses'], queryFn: fetchMyCourses });
export const useMyStaffAttendance = () => useQuery({ queryKey: ['my-staff-attendance'], queryFn: () => fetchMyStaffAttendance() });
