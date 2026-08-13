import type { ExamRow } from '../types';

export const TEST_TYPES = new Set(['UNIT_TEST', 'QUIZ']);
export const EXAM_TYPES = new Set(['MID_TERM', 'FINAL', 'PRACTICAL']);

export function isTest(exam: ExamRow) {
  return TEST_TYPES.has(exam.examType);
}

export function isTermExam(exam: ExamRow) {
  return EXAM_TYPES.has(exam.examType);
}

export function formatExamType(type?: string) {
  return (type || '').replace(/_/g, ' ');
}

export function splitAssessments(exams: ExamRow[] = []) {
  return {
    tests: exams.filter(isTest),
    exams: exams.filter(isTermExam),
    other: exams.filter((row) => !isTest(row) && !isTermExam(row)),
  };
}
