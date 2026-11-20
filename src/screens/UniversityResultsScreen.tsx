import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useParentUniversityResults } from '../hooks/useParentQueries';
import { createUniversityResultLink } from '../api/parent';
import type { UniversityResult } from '../api/parent';
import { colors } from '../theme';

const STATUS: Record<UniversityResult['resultStatus'], { label: string; tone: 'success' | 'danger' | 'warning' }> = {
  PASS: { label: 'Pass', tone: 'success' },
  FAIL: { label: 'Fail', tone: 'danger' },
  WITHHELD: { label: 'Withheld', tone: 'warning' },
};

function scoreLine(r: UniversityResult) {
  return (
    [
      r.gpa != null ? `GPA ${r.gpa}` : null,
      r.cgpa != null ? `CGPA ${r.cgpa}` : null,
      r.percentage != null ? `${r.percentage}%` : null,
    ]
      .filter(Boolean)
      .join(' · ') || '—'
  );
}

export function UniversityResultsScreen({ navigation }: any) {
  const { activeChildId, activeChild } = useAuth();
  const { data, isLoading, isError, error, refetch } = useParentUniversityResults(activeChildId);
  const [opening, setOpening] = useState<string | null>(null);
  const results = data?.results ?? [];
  // Newest semester first; the headline CGPA is the latest one the university has declared.
  const ordered = [...results].sort((a, b) => (b.semester ?? 0) - (a.semester ?? 0));
  const latestCgpa = ordered.find((r) => r.cgpa != null)?.cgpa ?? null;

  const openFile = async (fileId: string) => {
    if (!activeChildId) return;
    setOpening(fileId);
    try {
      const link = await createUniversityResultLink(activeChildId, fileId);
      await Linking.openURL(link.url);
    } catch (e) {
      Alert.alert('Could not open the file', (e as Error)?.message ?? 'Please try again.');
    } finally {
      setOpening(null);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="University Results"
        subtitle={activeChild ? activeChild.name : undefined}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.body}>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}

        {!isLoading && !isError && results.length === 0 ? (
          <EmptyState
            title="No university results yet"
            subtitle="Results declared by the university or board appear here after the school shares them."
          />
        ) : null}

        {latestCgpa != null ? (
          <Card style={{ marginBottom: 12 }}>
            <Text style={styles.meta}>Cumulative GPA</Text>
            <Text style={styles.score}>{latestCgpa}</Text>
            <Text style={styles.meta}>{results.length} semester result{results.length === 1 ? '' : 's'} shared by the school</Text>
          </Card>
        ) : null}

        {ordered.map((r) => (
          <Card key={r.id} style={{ marginBottom: 12 }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{r.title}</Text>
                <Text style={styles.meta}>
                  {[r.program, r.semester ? `Semester ${r.semester}` : null, r.session].filter(Boolean).join(' · ')}
                </Text>
                {r.declaredOn ? <Text style={styles.meta}>Declared {r.declaredOn}</Text> : null}
              </View>
              <Badge label={STATUS[r.resultStatus].label} tone={STATUS[r.resultStatus].tone} />
            </View>

            <Text style={styles.score}>{scoreLine(r)}</Text>
            <Text style={styles.meta}>{r.university}</Text>

            {r.courses.map((c, i) => (
              <View key={`${c.courseName}-${i}`} style={styles.courseRow}>
                <Text style={styles.course}>
                  {c.courseCode ? `${c.courseCode} · ` : ''}
                  {c.courseName}
                </Text>
                <Text style={styles.meta}>
                  {[c.marks != null ? `${c.marks} marks` : null, c.grade ? `Grade ${c.grade}` : null, c.creditHours != null ? `${c.creditHours} cr` : null]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </Text>
              </View>
            ))}

            {r.remarks ? <Text style={styles.remarks}>{r.remarks}</Text> : null}

            {r.files.length > 0 ? (
              <View style={{ marginTop: 12 }}>
                <PrimaryButton
                  title="Open result file"
                  variant="outline"
                  icon="document-attach-outline"
                  loading={opening === r.files[0].id}
                  onPress={() => openFile(r.files[0].id)}
                />
              </View>
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { fontWeight: '800', color: colors.text, fontSize: 16 },
  meta: { color: colors.textMuted, marginTop: 4 },
  score: { fontSize: 22, fontWeight: '800', color: colors.primary, marginTop: 12 },
  courseRow: { paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: 10 },
  course: { fontWeight: '700', color: colors.text },
  remarks: { marginTop: 12, color: colors.warning, fontWeight: '600' },
});
