import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { useTeacherAttendanceClasses } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';
import { addDays, formatDate, isoDate } from '../../utils/format';

export function TeacherAttendanceScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(isoDate());
  const { data, isLoading, isError, error, refetch } = useTeacherAttendanceClasses(date);
  const classes = data?.classes ?? [];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.sub}>{data?.dateLabel || formatDate(date)}</Text>
        <View style={styles.dateRow}>
          <Pressable onPress={() => setDate((d) => addDays(d, -1))} style={styles.dateBtn}>
            <Ionicons name="chevron-back" size={18} color={colors.white} />
          </Pressable>
          <Pressable onPress={() => setDate(isoDate())} style={styles.today}>
            <Text style={styles.todayText}>{date === isoDate() ? 'Today' : date}</Text>
          </Pressable>
          <Pressable onPress={() => setDate((d) => addDays(d, 1))} style={styles.dateBtn}>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {!isLoading && classes.length === 0 ? (
          <EmptyState title="No classes to mark" subtitle="You are not assigned as a class teacher yet." icon="checkmark-circle-outline" />
        ) : (
          classes.map((item) => (
            <Card
              key={item.id}
              style={{ marginBottom: 12 }}
              onPress={() => navigation.navigate('TeacherAttendanceSheet', { classId: item.id, date })}
            >
              <View style={styles.rowBetween}>
                <Text style={styles.className}>{item.gradeLabel || item.name}</Text>
                <Badge label={item.isComplete ? 'Done' : `${item.markedToday}/${item.totalStudents}`} tone={item.isComplete ? 'success' : 'warning'} />
              </View>
              <Text style={styles.meta}>
                {item.room || 'Room TBA'} · {item.totalStudents} students
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 18 },
  title: { color: colors.white, fontSize: 24, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 },
  dateBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    flex: 1,
    minHeight: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: { color: colors.white, fontWeight: '800' },
  body: { padding: 16, paddingBottom: 40 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  className: { fontSize: 17, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 },
  meta: { color: colors.textMuted, marginTop: 6 },
});
