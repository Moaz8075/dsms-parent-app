import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Badge, statusTone } from '../../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { useTeacherAnnouncements } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';
import { relativeTime } from '../../utils/format';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'archive', label: 'Archive' },
];

export function TeacherAnnouncementsScreen({ navigation }: any) {
  const [tab, setTab] = useState('active');
  const { data, isLoading, isError, error, refetch } = useTeacherAnnouncements(tab);
  const items = data?.items ?? [];

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Announcements"
        subtitle="Share updates with families"
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={() => navigation.navigate('TeacherAnnouncementCompose')} hitSlop={8}>
            <Ionicons name="add" size={24} color={colors.white} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.filters}>
          {TABS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[styles.pill, tab === item.key && styles.pillActive]}
            >
              <Text style={[styles.pillText, tab === item.key && styles.pillTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {!isLoading && items.length === 0 ? (
          <EmptyState title="No announcements" subtitle="Post a class or school notice." icon="megaphone-outline" />
        ) : (
          items.map((ann) => (
            <Card key={ann.id} style={{ marginBottom: 12 }}>
              <View style={styles.top}>
                <Badge label={ann.category || 'GENERAL'} />
                <Badge label={ann.status} tone={statusTone(ann.status)} />
              </View>
              <Text style={styles.title}>{ann.title}</Text>
              {ann.content ? (
                <Text style={styles.content} numberOfLines={3}>
                  {ann.content}
                </Text>
              ) : null}
              <Text style={styles.time}>
                {ann.authorName ? `${ann.authorName} · ` : ''}
                {relativeTime(ann.publishedAt)}
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
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontWeight: '700', color: colors.text },
  pillTextActive: { color: colors.white },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 10 },
  content: { color: colors.textMuted, marginTop: 8, lineHeight: 20 },
  time: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
});
