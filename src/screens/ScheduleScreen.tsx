import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useParentSchedule } from '../hooks/useParentQueries';
import { colors, radius } from '../theme';
import { DatePickerSheet } from '../components/DatePickerSheet';

const DAYS = [
  { dow: 1, short: 'Mon', long: 'Monday' },
  { dow: 2, short: 'Tue', long: 'Tuesday' },
  { dow: 3, short: 'Wed', long: 'Wednesday' },
  { dow: 4, short: 'Thu', long: 'Thursday' },
  { dow: 5, short: 'Fri', long: 'Friday' },
  { dow: 6, short: 'Sat', long: 'Saturday' },
  { dow: 0, short: 'Sun', long: 'Sunday' },
];

/** Weekly timetable for the active child / the signed-in student. Opens on today. */
export function ScheduleScreen({ navigation, route }: any) {
  const { activeChildId, activeChild } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const weekStart = useMemo(() => shiftDays(todayKey(), weekOffset * 7), [weekOffset]);
  const { data, isLoading, isError, error, refetch, isFetching } = useParentSchedule(activeChildId, weekStart);
  const today = new Date().getDay();
  // This week opens on today; other weeks open on their Monday.
  const [picked, setPicked] = useState<number | null>(null);
  const selected = picked ?? (weekOffset === 0 ? today : 1);
  const holidayByDate = useMemo(() => new Map((data?.holidays ?? []).map((h) => [h.date, h.name])), [data]);
  const dateOf = (dow: number) => shiftDays(data?.weekStart ?? weekStart, (dow + 6) % 7);
  const move = (delta: number) => { setWeekOffset((w) => w + delta); setPicked(null); };
  const slots = data?.slots ?? [];
  const byDay = useMemo(() => {
    const m = new Map<number, typeof slots>();
    slots.forEach((s) => m.set(s.dayOfWeek, [...(m.get(s.dayOfWeek) ?? []), s]));
    return m;
  }, [slots]);
  const list = byDay.get(selected) ?? [];
  const isTab = route?.name === 'ScheduleTab';
  const dayLong = DAYS.find((d) => d.dow === selected)?.long;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Timetable"
        subtitle={[activeChild?.name, data?.className].filter(Boolean).join(' · ') || undefined}
        onBack={isTab ? undefined : () => navigation.goBack()}
      />
      <View style={styles.weekBar}>
        <Pressable onPress={() => move(-1)} hitSlop={10} style={styles.arrow} accessibilityLabel="Previous week">
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Pressable onPress={() => setPickerOpen(true)} style={{ alignItems: 'center' }} accessibilityRole="button" accessibilityLabel="Choose a week from the calendar">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
            <Text style={styles.weekLabel}>{data?.weekLabel ?? 'Week'}</Text>
          </View>
          <Text style={styles.weekSub}>{weekOffset === 0 ? 'This week · tap to pick a date' : weekOffset === 1 ? 'Next week · tap to pick a date' : weekOffset === -1 ? 'Last week · tap to pick a date' : 'Tap to pick a date'}</Text>
        </Pressable>
        <Pressable onPress={() => move(1)} hitSlop={10} style={styles.arrow} accessibilityLabel="Next week">
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </View>
      {weekOffset !== 0 ? (
        <Pressable onPress={() => move(-weekOffset)} style={styles.backToday}>
          <Text style={styles.backTodayText}>Back to this week</Text>
        </Pressable>
      ) : null}
      <DatePickerSheet
        visible={pickerOpen}
        value={data?.weekStart ?? weekStart}
        title="Go to week of…"
        onClose={() => setPickerOpen(false)}
        onPick={(iso) => {
          // weeks between this week's Monday and the picked date's Monday
          const mondayOf = (k: string) => { const d = new Date(`${k}T00:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
          setWeekOffset(Math.round((mondayOf(iso) - mondayOf(todayKey())) / (7 * 86400000)));
          setPicked(new Date(`${iso}T00:00:00`).getDay());
        }}
      />
      <View style={styles.days}>
        {DAYS.map((d) => {
          const active = d.dow === selected;
          const count = byDay.get(d.dow)?.length ?? 0;
          const date = dateOf(d.dow);
          const isToday = weekOffset === 0 && d.dow === today;
          return (
            <Pressable key={d.dow} onPress={() => setPicked(d.dow)} style={[styles.day, active && styles.dayActive]}>
              <Text style={[styles.dayText, active && styles.dayTextActive]}>{d.short}</Text>
              <Text style={[styles.dateText, active && styles.dayTextActive]}>{Number(date.slice(8, 10))}</Text>
              <View style={[styles.dot, { opacity: count || holidayByDate.has(date) ? 1 : 0 }, holidayByDate.has(date) && { backgroundColor: colors.danger ?? '#dc2626' }, active && { backgroundColor: colors.white }]} />
              {isToday ? <Text style={[styles.todayTag, active && { color: colors.white }]}>Today</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {isLoading ? <LoadingState /> : null}
        {holidayByDate.has(dateOf(selected)) ? (
          <Card style={{ marginBottom: 10, backgroundColor: '#fef2f2' }}>
            <Text style={styles.subject}>Holiday — {holidayByDate.get(dateOf(selected))}</Text>
            <Text style={styles.meta}>No classes on this day.</Text>
          </Card>
        ) : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {!isLoading && !isError && slots.length === 0 && weekOffset === 0 ? (
          <EmptyState title="No timetable yet" subtitle="Your class schedule will appear here once the school publishes it." />
        ) : null}
        {!isLoading && !isError && slots.length === 0 && weekOffset !== 0 ? (
          <EmptyState title="No classes this week" subtitle="Nothing is scheduled for this week yet." />
        ) : null}
        {!isLoading && !isError && slots.length > 0 && list.length === 0 && !holidayByDate.has(dateOf(selected)) ? (
          <EmptyState title={`No classes on ${dayLong}`} subtitle="Pick another day above." />
        ) : null}
        {list.map((s) => (
          <Card key={s.key} style={{ marginBottom: 10 }}>
            <View style={styles.row}>
              <View style={styles.time}>
                <Text style={styles.timeText}>{s.startTime}</Text>
                <Text style={styles.timeSub}>{s.endTime}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subject}>{s.subject}</Text>
                <Text style={styles.meta}>Room {s.room}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Local today as YYYY-MM-DD. */
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function shiftDays(key: string, days: number) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

const styles = StyleSheet.create({
  weekBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 10, backgroundColor: colors.white },
  arrow: { padding: 8 },
  backToday: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 12, backgroundColor: colors.white },
  backTodayText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  weekLabel: { fontWeight: '800', color: colors.text, fontSize: 15 },
  weekSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  dateText: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
  root: { flex: 1, backgroundColor: colors.background },
  days: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: colors.white },
  day: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.background },
  dayActive: { backgroundColor: colors.primary },
  dayText: { fontSize: 12, fontWeight: '800', color: colors.text },
  dayTextActive: { color: colors.white },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 4 },
  todayTag: { fontSize: 9, fontWeight: '700', color: colors.primary, marginTop: 2 },
  body: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  time: { width: 74, paddingRight: 12, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
  timeText: { fontWeight: '800', color: colors.primary, fontSize: 13 },
  timeSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  subject: { fontWeight: '800', color: colors.text, fontSize: 15 },
  meta: { color: colors.textMuted, marginTop: 3, fontSize: 12 },
});
