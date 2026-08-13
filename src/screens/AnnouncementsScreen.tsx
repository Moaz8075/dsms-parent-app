import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useParentAnnouncements } from '../hooks/useParentQueries';
import { colors, radius } from '../theme';
import { relativeTime } from '../utils/format';

const FILTERS = ['All', 'School', 'Class', 'Events'] as const;

export function AnnouncementsScreen({ navigation }: any) {
  const { activeChildId, activeChild } = useAuth();
  const { data, isLoading, isError, error, refetch } = useParentAnnouncements(activeChildId);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const items = useMemo(() => {
    const list = data?.announcements ?? [];
    if (filter === 'All') return list;
    if (filter === 'Events') return list.filter((a) => (a.category || '').toUpperCase() === 'EVENT');
    if (filter === 'Class') return list.filter((a) => ['CLASS', 'EXAM', 'QUIZ'].includes((a.category || '').toUpperCase()));
    return list.filter((a) => ['GENERAL', 'HOLIDAY', 'SCHOOL'].includes((a.category || 'GENERAL').toUpperCase()));
  }, [data, filter]);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Announcements"
        subtitle={activeChild ? activeChild.name : undefined}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.pill, filter === item && styles.pillActive]}
            >
              <Text style={[styles.pillText, filter === item && styles.pillTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {!isLoading && items.length === 0 ? (
          <EmptyState title="No announcements" subtitle="School notices will appear here." icon="megaphone-outline" />
        ) : (
          items.map((ann) => (
            <Card key={ann.id} style={{ marginBottom: 12 }}>
              <View style={styles.top}>
                <Badge label={ann.category || 'GENERAL'} />
                <Text style={styles.time}>{relativeTime(ann.publishedAt)}</Text>
              </View>
              <Text style={styles.title}>{ann.title}</Text>
              <Text style={styles.content}>{ann.content}</Text>
              {ann.authorName ? <Text style={styles.time}>{ann.authorName}</Text> : null}
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
