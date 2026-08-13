import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useParentReportCard } from '../hooks/useParentQueries';
import { colors } from '../theme';
import { formatDate } from '../utils/format';

export function ReportCardScreen({ navigation }: any) {
  const { activeChildId, activeChild } = useAuth();
  const { data, isLoading, isError, error, refetch } = useParentReportCard(activeChildId);
  const summary = data?.summary;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Report Card"
        subtitle={activeChild ? activeChild.name : undefined}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.body}>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}

        {summary ? (
          <Card style={styles.hero}>
            <Text style={styles.heroLabel}>{summary.academicYear}</Text>
            <Text style={styles.heroValue}>{summary.percentage ?? '—'}%</Text>
            <Text style={styles.heroSub}>
              {summary.gradeLabel ? `Grade ${summary.gradeLabel}` : 'Official term summary'}
              {summary.rank ? ` · Rank ${summary.rank}` : ''}
            </Text>
            {summary.generatedAt ? (
              <Text style={styles.heroSub}>Issued {summary.generatedAt}</Text>
            ) : null}
          </Card>
        ) : !isLoading ? (
          <EmptyState
            title="No official report yet"
            subtitle="Term report cards appear here after the school publishes them."
          />
        ) : null}

        {(data?.exams ?? []).map((exam) => (
          <Card key={exam.examId} style={{ marginBottom: 12 }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exam}>{exam.examName}</Text>
                <Text style={styles.meta}>{exam.examDate ? formatDate(exam.examDate) : exam.examType}</Text>
              </View>
              {exam.percentage != null ? <Badge label={`${exam.percentage}%`} tone="success" /> : null}
            </View>
            {exam.subjects.map((row) => (
              <View key={row.key} style={styles.subjectRow}>
                <Text style={styles.subject}>{row.subject}</Text>
                <Text style={styles.meta}>
                  {row.isAbsent ? 'Absent' : `${row.marks ?? '—'}/${row.maxMarks}`} · {row.grade}
                </Text>
              </View>
            ))}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  hero: { backgroundColor: colors.primary, marginBottom: 16 },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontWeight: '700' },
  heroValue: { color: colors.white, fontSize: 36, fontWeight: '800', marginVertical: 6 },
  heroSub: { color: 'rgba(255,255,255,0.8)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exam: { fontWeight: '800', color: colors.text, fontSize: 16 },
  meta: { color: colors.textMuted, marginTop: 4 },
  subjectRow: { paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: 10 },
  subject: { fontWeight: '700', color: colors.text },
});
