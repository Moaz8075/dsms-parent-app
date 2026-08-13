import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useParentAcademics } from '../hooks/useParentQueries';
import { colors, radius } from '../theme';
import { formatDate } from '../utils/format';
import { formatExamType, splitAssessments } from '../utils/assessments';
import type { ExamRow } from '../types';

type Kind = 'tests' | 'exams';

const COPY: Record<Kind, { title: string; empty: string; subtitle: string }> = {
  tests: {
    title: 'Class Tests',
    subtitle: 'Unit tests and quizzes with full marks',
    empty: 'No class tests published yet.',
  },
  exams: {
    title: 'Exams',
    subtitle: 'Mid-term, final, and practical records',
    empty: 'No exam results published yet.',
  },
};

export function TestsScreen({ navigation }: any) {
  return <AssessmentListScreen navigation={navigation} kind="tests" />;
}

export function ExamsScreen({ navigation }: any) {
  return <AssessmentListScreen navigation={navigation} kind="exams" />;
}

function AssessmentListScreen({ navigation, kind }: { navigation: any; kind: Kind }) {
  const { activeChildId, activeChild } = useAuth();
  const { data, isLoading, isError, error, refetch } = useParentAcademics(activeChildId);
  const [subject, setSubject] = useState('All');
  const copy = COPY[kind];

  const rows = useMemo(() => {
    const split = splitAssessments(data?.exams ?? []);
    return kind === 'tests' ? split.tests : [...split.exams, ...split.other];
  }, [data, kind]);

  const subjects = useMemo(() => {
    const names = new Set<string>();
    for (const exam of rows) {
      for (const row of exam.subjects ?? []) names.add(row.subject);
    }
    return ['All', ...names];
  }, [rows]);

  const filtered = useMemo(() => {
    if (subject === 'All') return rows;
    return rows.filter((exam) => exam.subjects.some((row) => row.subject === subject));
  }, [rows, subject]);

  const average =
    filtered.filter((e) => e.percentage != null).length > 0
      ? Math.round(
          filtered.reduce((sum, e) => sum + (e.percentage ?? 0), 0) /
            Math.max(filtered.filter((e) => e.percentage != null).length, 1),
        )
      : 0;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={copy.title}
        subtitle={activeChild ? `${activeChild.name} · ${copy.subtitle}` : copy.subtitle}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <Card style={styles.hero}>
          <Text style={styles.heroLabel}>{kind === 'tests' ? 'Test average' : 'Exam average'}</Text>
          <Text style={styles.heroValue}>{average}%</Text>
          <Text style={styles.heroSub}>{filtered.length} record{filtered.length === 1 ? '' : 's'}</Text>
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 14 }}>
          {subjects.map((name) => (
            <Pressable
              key={name}
              onPress={() => setSubject(name)}
              style={[styles.pill, subject === name && styles.pillActive]}
            >
              <Text style={[styles.pillText, subject === name && styles.pillTextActive]}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {!isLoading && filtered.length === 0 ? (
          <EmptyState title={copy.empty} icon="school-outline" />
        ) : (
          filtered.map((exam) => (
            <AssessmentCard
              key={exam.examId}
              exam={exam}
              onPress={() => navigation.navigate('ExamDetail', { examId: exam.examId, kind })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function AssessmentCard({ exam, onPress }: { exam: ExamRow; onPress: () => void }) {
  return (
    <Card style={{ marginBottom: 12 }} onPress={onPress}>
      <View style={styles.row}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.title}>{exam.examName}</Text>
          <Text style={styles.meta}>
            {formatExamType(exam.examType)}
            {exam.examDate ? ` · ${formatDate(exam.examDate)}` : ''}
            {` · ${exam.subjectCount} subject${exam.subjectCount === 1 ? '' : 's'}`}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.score}>{exam.percentage != null ? `${exam.percentage}%` : '—'}</Text>
          <Badge label={formatExamType(exam.examType)} tone="info" />
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.link}>View full record</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  hero: { backgroundColor: colors.primary },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontWeight: '700' },
  heroValue: { color: colors.white, fontSize: 36, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontWeight: '700', color: colors.text },
  pillTextActive: { color: colors.white },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontWeight: '800', color: colors.text, fontSize: 16 },
  meta: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
  score: { fontWeight: '800', color: colors.success, fontSize: 20, marginBottom: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 4 },
  link: { color: colors.primary, fontWeight: '700' },
});
