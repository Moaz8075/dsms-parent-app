import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { useTeacherSchedule } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';

const DAYS = [
  { key: 1, label: 'Mon' },
  { key: 2, label: 'Tue' },
  { key: 3, label: 'Wed' },
  { key: 4, label: 'Thu' },
  { key: 5, label: 'Fri' },
  { key: 6, label: 'Sat' },
];

export function TeacherScheduleScreen({ navigation }: any) {
  const { data, isLoading, isError, error, refetch } = useTeacherSchedule();
  const today = new Date().getDay();
  const defaultDay = today === 0 ? 1 : today;
  const [day, setDay] = useState(defaultDay);

  const slots = useMemo(
    () => (data?.slots ?? []).filter((slot) => slot.dayOfWeek === day),
    [data, day],
  );

  return (
    <View style={styles.root}>
      <ScreenHeader title="My Schedule" subtitle="Weekly timetable" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {DAYS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setDay(item.key)}
              style={[styles.pill, day === item.key && styles.pillActive]}
            >
              <Text style={[styles.pillText, day === item.key && styles.pillTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {!isLoading && slots.length === 0 ? (
          <EmptyState title="No classes this day" icon="calendar-outline" />
        ) : (
          slots.map((slot) => (
            <Card key={slot.key} style={{ marginBottom: 10 }}>
              <Text style={styles.time}>
                {slot.startTime} – {slot.endTime}
              </Text>
              <Text style={styles.subject}>{slot.subject}</Text>
              <Text style={styles.meta}>
                {slot.gradeLabel || slot.className}
                {slot.room ? ` · ${slot.room}` : ''}
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
  body: { padding: 16, paddingBottom: 40 },
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
  time: { color: colors.primary, fontWeight: '800' },
  subject: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 6 },
  meta: { color: colors.textMuted, marginTop: 4 },
});
