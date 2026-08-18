import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Badge, statusTone } from '../../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { useTeacherStudents } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';
import { initials } from '../../utils/format';

export function TeacherStudentsScreen({ navigation, route }: any) {
  const filterGrade: string | undefined = route.params?.grade;
  const filterTitle: string | undefined = route.params?.title;
  const { data, isLoading, isError, error, refetch } = useTeacherStudents();
  const [query, setQuery] = useState('');

  const students = useMemo(() => {
    const list = data?.students ?? [];
    return list.filter((student) => {
      const hay = `${student.name} ${student.grade} ${student.id}`.toLowerCase();
      const matchesQuery = hay.includes(query.trim().toLowerCase());
      const matchesClass = filterGrade
        ? student.grade.toLowerCase().includes(String(filterGrade).toLowerCase().replace(/^grade\s+/i, ''))
        : true;
      return matchesQuery && matchesClass;
    });
  }, [data, query, filterGrade]);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={filterTitle ? filterTitle : 'Students'}
        subtitle={filterGrade || `${data?.stats?.total ?? 0} in your classes`}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.search}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or ID"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>
        {data?.stats ? (
          <View style={styles.stats}>
            <Stat label="At risk" value={data.stats.atRisk} />
            <Stat label="Top" value={data.stats.topPerformers} />
            <Stat label="Attendance" value={`${data.stats.avgAttendance}%`} />
          </View>
        ) : null}
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {!isLoading && students.length === 0 ? (
          <EmptyState title="No students found" icon="people-outline" />
        ) : (
          students.map((student) => (
            <Card
              key={student.studentId}
              style={{ marginBottom: 10 }}
              onPress={() =>
                navigation.navigate('TeacherStudentDetail', {
                  studentId: student.studentId,
                  name: student.name,
                  grade: student.grade,
                  avatar: student.avatar,
                })
              }
            >
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{student.avatar || initials(student.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{student.name}</Text>
                  <Text style={styles.meta}>
                    {student.id} · {student.grade}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Badge label={student.status} tone={statusTone(student.status)} />
                  <Text style={styles.gradeLetter}>{student.gradeLetter}</Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  search: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: { minHeight: 46, color: colors.text },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  stat: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { fontWeight: '800', color: colors.text, fontSize: 16 },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '800' },
  name: { fontWeight: '800', color: colors.text, fontSize: 16 },
  meta: { color: colors.textMuted, marginTop: 3, fontSize: 12 },
  gradeLetter: { fontWeight: '800', color: colors.primary },
});
