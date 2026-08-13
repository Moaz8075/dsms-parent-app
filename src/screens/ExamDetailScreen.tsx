import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useParentAcademics } from '../hooks/useParentQueries';
import { colors } from '../theme';
import { formatDate } from '../utils/format';
import { formatExamType } from '../utils/assessments';

export function ExamDetailScreen({ navigation, route }: any) {
  const { examId, kind } = route.params as { examId: string; kind?: 'tests' | 'exams' };
  const { activeChildId, activeChild } = useAuth();
  const { data, isLoading, isError, error, refetch } = useParentAcademics(activeChildId);
  const exam = (data?.exams ?? []).find((row) => row.examId === examId);
  const title = kind === 'tests' ? 'Test record' : 'Exam record';

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={title}
        subtitle={activeChild?.name}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.body}>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {!isLoading && !exam ? (
          <EmptyState title="Record not found" />
        ) : exam ? (
          <>
            <Card style={styles.hero}>
              <Text style={styles.heroLabel}>{formatExamType(exam.examType)}</Text>
              <Text style={styles.heroTitle}>{exam.examName}</Text>
              <Text style={styles.heroValue}>
                {exam.percentage != null ? `${exam.percentage}%` : '—'}
              </Text>
              <Text style={styles.heroSub}>
                {exam.examDate ? formatDate(exam.examDate) : 'Date not set'}
                {exam.obtainedMarks != null && exam.totalMarks
                  ? ` · ${exam.obtainedMarks}/${exam.totalMarks}`
                  : ''}
              </Text>
            </Card>

            <Text style={styles.section}>Subject-wise marks</Text>
            {exam.subjects.map((row) => (
              <Card key={row.key} style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subject}>{row.subject}</Text>
                    {row.remarks ? <Text style={styles.remarks}>{row.remarks}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {row.isAbsent ? (
                      <Badge label="Absent" tone="danger" />
                    ) : (
                      <>
                        <Text style={styles.score}>
                          {row.marks ?? '—'}/{row.maxMarks}
                        </Text>
                        <Badge label={row.grade} tone="success" />
                      </>
                    )}
                    {row.percentage != null && !row.isAbsent ? (
                      <Text style={styles.meta}>{row.percentage}%</Text>
                    ) : null}
                  </View>
                </View>
                {row.attachments?.map((file) => (
                  <FileRow key={file.fileUrl} name={file.fileName} url={file.fileUrl} />
                ))}
              </Card>
            ))}

            {exam.examAttachments?.length ? (
              <>
                <Text style={styles.section}>Documents</Text>
                {exam.examAttachments.map((file) => (
                  <Card key={file.fileUrl} style={{ marginBottom: 10 }}>
                    <FileRow name={file.fileName} url={file.fileUrl} />
                  </Card>
                ))}
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function FileRow({ name, url }: { name: string; url: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)} style={styles.fileRow}>
      <Ionicons name="document-text-outline" size={18} color={colors.primary} />
      <Text style={styles.fileName} numberOfLines={1}>
        {name}
      </Text>
      <Ionicons name="open-outline" size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  hero: { backgroundColor: colors.primary, marginBottom: 8 },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontWeight: '700' },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 6 },
  heroValue: { color: colors.white, fontSize: 36, fontWeight: '800', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  section: { fontWeight: '800', fontSize: 16, marginTop: 18, marginBottom: 10, color: colors.text },
  row: { flexDirection: 'row', gap: 12 },
  subject: { fontWeight: '800', color: colors.text, fontSize: 16 },
  remarks: { color: colors.textMuted, marginTop: 6, lineHeight: 20 },
  score: { fontWeight: '800', color: colors.primary, fontSize: 16, marginBottom: 4 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  fileName: { flex: 1, color: colors.text, fontWeight: '600' },
});
