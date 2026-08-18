import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Badge, statusTone } from '../../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { useTeacherTestsAndMarks } from '../../hooks/useTeacherQueries';
import { colors } from '../../theme';
import type { TestCard } from '../../api/teacher';

export function TeacherTestsScreen({ navigation }: any) {
  const { data, isLoading, isError, error, refetch } = useTeacherTestsAndMarks();
  const incomplete = data?.incomplete ?? [];
  const completed = data?.completed ?? [];

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Tests & Marks"
        subtitle={data?.termLabel || 'Assessments'}
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={() => navigation.navigate('TeacherCreateTest')} hitSlop={8}>
            <Ionicons name="add" size={24} color={colors.white} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.body}>
        {data?.summary ? (
          <View style={styles.stats}>
            <Stat label="To mark" value={data.summary.incomplete} />
            <Stat label="Unmarked" value={data.summary.unmarkedStudents} />
            <Stat label="Done" value={data.summary.completed} />
          </View>
        ) : null}
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        <Text style={styles.section}>Needs marking</Text>
        {incomplete.length === 0 && !isLoading ? (
          <EmptyState title="Nothing waiting" subtitle="Create a test or wait for the next exam." />
        ) : (
          incomplete.map((item) => (
            <TestRow key={item.key} item={item} onPress={() => navigation.navigate('TeacherMarksheet', { examSubjectId: item.examSubjectId })} />
          ))
        )}
        <Text style={styles.section}>Completed</Text>
        {completed.map((item) => (
          <TestRow key={item.key} item={item} onPress={() => navigation.navigate('TeacherMarksheet', { examSubjectId: item.examSubjectId })} />
        ))}
      </ScrollView>
    </View>
  );
}

function TestRow({ item, onPress }: { item: TestCard; onPress: () => void }) {
  return (
    <Card style={{ marginBottom: 10 }} onPress={onPress}>
      <View style={styles.rowBetween}>
        <Text style={styles.type}>{item.testType}</Text>
        <Badge label={item.markStatus.replace('_', ' ')} tone={statusTone(item.markStatus)} />
      </View>
      <Text style={styles.title}>{item.testName}</Text>
      <Text style={styles.meta}>
        {item.classLabel} · {item.subject} · {item.examDate}
      </Text>
      <Text style={styles.meta}>
        Marked {item.markedCount}/{item.totalStudents} · Max {item.maxMarks}
      </Text>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
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
  stats: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  stat: { flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 12, alignItems: 'center' },
  statValue: { fontWeight: '800', fontSize: 18, color: colors.text },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  section: { fontWeight: '800', marginTop: 16, marginBottom: 10, color: colors.text, fontSize: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 6 },
  meta: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
});
