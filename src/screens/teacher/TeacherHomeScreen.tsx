import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTeacherDashboard } from '../../hooks/useTeacherQueries';
import { Card, SectionTitle } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { EmptyState, ErrorState } from '../../components/States';
import { colors, radius, shadow } from '../../theme';
import { greeting } from '../../utils/format';

const QUICK_ACTIONS = [
  { key: 'TeacherOtp', label: 'OTP', hint: 'Today’s class code', icon: 'keypad-outline' as const, color: '#0F766E' },
  { key: 'TeacherStudents', label: 'Students', hint: 'Class roll list', icon: 'people-outline' as const, color: '#7C3AED' },
  { key: 'TeacherAttendanceTab', label: 'Attendance', hint: 'Mark class today', icon: 'checkmark-circle-outline' as const, color: '#1F9D6A' },
  { key: 'TeacherDiary', label: 'Diary', hint: 'Notes for parents', icon: 'book-outline' as const, color: '#5C6BC0' },
  { key: 'TeacherTests', label: 'Tests', hint: 'Create & mark', icon: 'create-outline' as const, color: '#0EA5A4' },
  { key: 'TeacherSchedule', label: 'Schedule', hint: 'Weekly timetable', icon: 'calendar-outline' as const, color: '#E08B2E' },
  { key: 'TeacherAnnouncements', label: 'Announce', hint: 'Notify families', icon: 'megaphone-outline' as const, color: '#DC2626' },
  { key: 'TeacherChatTab', label: 'Chat', hint: 'Message parents', icon: 'chatbubbles-outline' as const, color: '#2563EB' },
];

export function TeacherHomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, school } = useAuth();
  const dashboard = useTeacherDashboard();
  const data = dashboard.data;
  const pending = data?.pendingTasks ?? [];
  const todaysClasses = data?.todaysClasses ?? [];

  const go = (key: string) => navigation.navigate(key);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.school} numberOfLines={1}>
              {school?.name || 'My school'}
            </Text>
            <Text style={styles.hello}>
              {greeting()}, {user?.firstName}
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate('TeacherAnnouncements')} style={styles.bell}>
            <Ionicons name="notifications-outline" size={22} color={colors.white} />
          </Pressable>
        </View>
        <Text style={styles.headerSub}>
          {data?.greeting?.dateLabel || 'Your teaching hub'}
          {data?.greeting?.semesterLabel ? ` · ${data.greeting.semesterLabel}` : ''}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {dashboard.isError ? (
          <ErrorState message={(dashboard.error as Error)?.message} onRetry={() => dashboard.refetch()} />
        ) : null}

        <Text style={styles.ctaTitle}>Quick actions</Text>
        <Text style={styles.ctaHint}>Start with today’s OTP and class list, then attendance and the rest.</Text>
        <View style={styles.grid}>
          {QUICK_ACTIONS.map((action) => {
            const hint =
              action.key === 'TeacherStudents'
                ? `${data?.stats?.totalStudents ?? 0} in your classes`
                : action.hint;
            return (
              <Pressable
                key={action.key}
                onPress={() => go(action.key)}
                style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.9 }]}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}18` }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionHint}>{hint}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title="At a glance" />
        <View style={styles.glance}>
          <GlanceChip label="Students" value={String(data?.stats?.totalStudents ?? 0)} />
          <GlanceChip label="Classes" value={String(data?.stats?.assignedClasses ?? 0)} />
          <GlanceChip label="Today left" value={String(data?.stats?.todaysClassesRemaining ?? 0)} />
        </View>

        <SectionTitle
          title="Today’s classes"
          action={{ label: 'Schedule', onPress: () => navigation.navigate('TeacherSchedule') }}
        />
        {todaysClasses.length === 0 ? (
          <Card>
            <EmptyState title="No classes today" subtitle="Enjoy the quieter day, or check your weekly schedule." />
          </Card>
        ) : (
          todaysClasses.map((item: any) => (
            <Card key={item.id} style={{ marginBottom: 10 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.time}>{item.startTime}</Text>
                <Badge label={labelStatus(item.status)} tone={classTone(item.status)} />
              </View>
              <Text style={styles.classTitle}>{item.subject}</Text>
              <Text style={styles.meta}>
                {item.grade}
                {item.room ? ` · ${item.room}` : ''}
                {item.durationLabel ? ` · ${item.durationLabel}` : ''}
              </Text>
            </Card>
          ))
        )}

        <View style={{ marginTop: 10 }}>
          <SectionTitle title="Pending tasks" />
          {pending.length === 0 ? (
            <Card>
              <EmptyState title="You’re all caught up" subtitle="No attendance or marking waiting on you." />
            </Card>
          ) : (
            pending.map((task: any) => (
              <Card
                key={task.key}
                style={{ marginBottom: 10 }}
                onPress={() => go(taskPath(task.type))}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.classTitle}>{task.title}</Text>
                  {task.urgent ? <Badge label="Urgent" tone="danger" /> : null}
                </View>
                <Text style={styles.meta}>{task.description}</Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function GlanceChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

function labelStatus(status?: string) {
  if (status === 'in_progress') return 'Now';
  if (status === 'completed') return 'Done';
  return 'Upcoming';
}

function classTone(status?: string) {
  if (status === 'completed') return 'success' as const;
  if (status === 'in_progress') return 'warning' as const;
  return 'info' as const;
}

function taskPath(type?: string) {
  if (type === 'attendance') return 'TeacherAttendanceTab';
  if (type === 'assignments' || type === 'exams' || type === 'results') return 'TeacherTests';
  return 'TeacherMoreTab';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  school: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontSize: 12 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hello: { color: colors.white, fontSize: 24, fontWeight: '800', marginTop: 4 },
  headerSub: { color: 'rgba(255,255,255,0.75)', marginTop: 8 },
  body: { padding: 16, paddingBottom: 32 },
  glance: { flexDirection: 'row', gap: 10, marginBottom: 18, marginTop: 2 },
  chip: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...shadow.card,
  },
  chipLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipValue: { color: colors.text, fontWeight: '800', fontSize: 18, marginTop: 2 },
  ctaTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
  ctaHint: { color: colors.textMuted, marginBottom: 14, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  actionCard: {
    width: '47.5%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    ...shadow.card,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
  actionHint: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { color: colors.primary, fontWeight: '800' },
  classTitle: { fontWeight: '800', color: colors.text, fontSize: 16, marginTop: 8 },
  meta: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
});
