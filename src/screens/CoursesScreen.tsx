import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useChildCourses, useMyCourses } from '../hooks/useFamily';
import { colors } from '../theme';

/** Teachers: courses they teach. Parents and students: courses taken and who teaches each. */
export function CoursesScreen({ navigation }: any) {
  const { isTeacher, activeChildId, activeChild } = useAuth();
  const mine = useMyCourses();
  const child = useChildCourses(isTeacher ? null : activeChildId);
  const q: any = isTeacher ? mine : child;
  const rows: any[] = q.data ?? [];
  const university = !isTeacher && activeChild?.track === 'UNIVERSITY';
  const credits = rows.reduce((n, c) => n + (c.creditHours ?? 0), 0);
  // University: group by semester so a student sees the whole programme at a glance.
  const groups: { label: string | null; items: any[] }[] = university
    ? [...new Set(rows.map((c) => c.semester ?? 0))]
        .sort((a, b) => a - b)
        .map((s) => ({ label: s ? `Semester ${s}` : 'Other', items: rows.filter((c) => (c.semester ?? 0) === s) }))
    : [{ label: null, items: rows }];

  return (
    <View style={styles.root}>
      <ScreenHeader title={isTeacher ? 'My Courses' : 'Courses'} subtitle={isTeacher ? undefined : activeChild?.name} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        {q.isLoading ? <LoadingState /> : null}
        {q.isError ? <ErrorState message={(q.error as Error)?.message} onRetry={() => q.refetch()} /> : null}
        {!q.isLoading && !q.isError && rows.length === 0 ? (
          <EmptyState title="No courses yet" subtitle={isTeacher ? 'Courses assigned to you will appear here.' : 'Courses assigned to the class will appear here.'} />
        ) : null}
        {university && rows.length > 0 ? (
          <Text style={styles.summary}>{rows.length} courses · {credits} credit hours</Text>
        ) : null}
        {groups.map((g) => (
          <View key={g.label ?? 'all'}>
            {g.label ? <Text style={styles.group}>{g.label}</Text> : null}
          {g.items.map((c) => (
            <Card key={c.id} style={{ marginBottom: 12 }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{c.courseName}</Text>
                  <Text style={styles.meta}>
                    {c.courseCode}{c.creditHours ? ` · ${c.creditHours} cr` : ''}
                    {isTeacher ? ` · ${c.className}` : c.teacherName ? ` · ${c.teacherName}` : ''}
                  </Text>
                  {isTeacher ? <Text style={styles.meta}>{c.students} students{c.programName ? ` · ${c.programName}` : ''}</Text> : null}
                </View>
                <Badge label={c.isElective ? 'Elective' : 'Core'} tone={c.isElective ? 'info' : 'muted'} />
              </View>
            </Card>
          ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontWeight: '800', color: colors.text, fontSize: 15 },
  meta: { color: colors.textMuted, marginTop: 3, fontSize: 12 },
  summary: { color: colors.textMuted, fontWeight: '600', marginBottom: 10 },
  group: { color: colors.primary, fontWeight: '800', marginVertical: 8, textTransform: 'uppercase', fontSize: 12 },
});
