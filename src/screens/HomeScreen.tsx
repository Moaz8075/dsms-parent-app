import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  useParentAnnouncements,
  useParentChildren,
  useParentDashboard,
  useParentDiary,
} from '../hooks/useParentQueries';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { Card, SectionTitle } from '../components/Card';
import { EmptyState, ErrorState } from '../components/States';
import { colors, radius, shadow } from '../theme';
import { formatShortDate, greeting } from '../utils/format';

const QUICK_ACTIONS = [
  { key: 'Fees', label: 'Pay fees', hint: 'Dues & receipts', icon: 'card-outline' as const, color: '#1A2B6D' },
  { key: 'Leave', label: 'Leave', hint: 'Request time off', icon: 'calendar-outline' as const, color: '#E08B2E' },
  { key: 'DiaryTab', label: 'Diary', hint: 'Homework today', icon: 'book-outline' as const, color: '#5C6BC0' },
  { key: 'Attendance', label: 'Attendance', hint: 'Daily record', icon: 'checkmark-circle-outline' as const, color: '#1F9D6A' },
  { key: 'Tests', label: 'Tests', hint: 'Class tests & quizzes', icon: 'create-outline' as const, color: '#0EA5A4' },
  { key: 'Exams', label: 'Exams', hint: 'Mid-term & finals', icon: 'school-outline' as const, color: '#7C3AED' },
  { key: 'ChatTab', label: 'Chat', hint: 'Message teachers', icon: 'chatbubbles-outline' as const, color: '#2563EB' },
  { key: 'ReportCard', label: 'Report card', hint: 'Official term result', icon: 'document-text-outline' as const, color: '#DC2626' },
];

export function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, activeChild, activeChildId } = useAuth();
  useParentChildren();
  const dashboard = useParentDashboard(activeChildId);
  const announcements = useParentAnnouncements(activeChildId);
  const diary = useParentDiary(activeChildId);

  const attendance = dashboard.data?.stats?.avgAttendance ?? activeChild?.attendance ?? 0;
  const todayDiaryCount =
    diary.data?.dates?.find((day) => day.date === new Date().toISOString().slice(0, 10))?.items?.length ?? 0;

  const go = (key: string) => {
    if (key.endsWith('Tab')) navigation.navigate(key);
    else navigation.navigate(key);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <ChildSwitcher />
          <Pressable onPress={() => navigation.navigate('Announcements')} style={styles.bell}>
            <Ionicons name="notifications-outline" size={22} color={colors.white} />
          </Pressable>
        </View>
        <Text style={styles.hello}>
          {greeting()}, {user?.firstName}
        </Text>
        <Text style={styles.headerSub}>
          {activeChild ? `${activeChild.name} · ${activeChild.grade}` : 'Your family hub'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.ctaTitle}>Quick actions</Text>
        <Text style={styles.ctaHint}>The things parents use most — fees, leave, diary, and results.</Text>

        <View style={styles.grid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              onPress={() => go(action.key)}
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.9 }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}18` }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionHint}>{action.hint}</Text>
            </Pressable>
          ))}
        </View>

        {dashboard.isError ? (
          <ErrorState message={(dashboard.error as Error)?.message} onRetry={() => dashboard.refetch()} />
        ) : null}

        <View style={styles.glance}>
          <GlanceChip label="Attendance" value={`${attendance}%`} onPress={() => navigation.navigate('Attendance')} />
          <GlanceChip
            label="Today"
            value={todayDiaryCount ? `${todayDiaryCount} diary` : 'No diary'}
            onPress={() => navigation.navigate('DiaryTab')}
          />
        </View>

        <View style={{ marginTop: 8 }}>
          <SectionTitle
            title="Recent updates"
            action={{ label: 'Diary', onPress: () => navigation.navigate('DiaryTab') }}
          />
          <Card>
            {(dashboard.data?.recentUpdates ?? []).length === 0 ? (
              <EmptyState title="No recent updates" subtitle="Check back after the next school activity." />
            ) : (
              dashboard.data?.recentUpdates.slice(0, 4).map((item) => (
                <View key={item.id} style={styles.updateRow}>
                  <View style={styles.updateIcon}>
                    <Ionicons name={updateIcon(item.type)} size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.updateTitle}>{item.title}</Text>
                    <Text style={styles.updateMeta}>
                      {item.child} · {item.time}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>

        <View style={{ marginTop: 18, marginBottom: 24 }}>
          <SectionTitle
            title="Announcements"
            action={{ label: 'View all', onPress: () => navigation.navigate('Announcements') }}
          />
          {(announcements.data?.announcements ?? []).slice(0, 3).map((ann) => (
            <Card key={ann.id} style={{ marginBottom: 10 }} onPress={() => navigation.navigate('Announcements')}>
              <Text style={styles.annDate}>{formatShortDate(ann.publishedAt)}</Text>
              <Text style={styles.updateTitle}>{ann.title}</Text>
              <Text numberOfLines={2} style={styles.updateMeta}>
                {ann.content}
              </Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function GlanceChip({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </Pressable>
  );
}

function updateIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type === 'result') return 'trophy-outline';
  if (type === 'leave') return 'document-text-outline';
  return 'calendar-outline';
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
  bell: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hello: { color: colors.white, fontSize: 24, fontWeight: '800', marginTop: 16 },
  headerSub: { color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  body: { padding: 16, paddingBottom: 32 },
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
  glance: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  chip: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...shadow.card,
  },
  chipLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipValue: { color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 2 },
  updateRow: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  updateIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateTitle: { fontWeight: '700', color: colors.text },
  updateMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  annDate: { color: colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
});
