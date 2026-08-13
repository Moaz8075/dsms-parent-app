import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useParentDiary } from '../hooks/useParentQueries';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { colors, radius } from '../theme';
import { formatDate } from '../utils/format';
import type { DiaryItem } from '../types';

export function DiaryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { activeChildId, activeChild } = useAuth();
  const { data, isLoading, isError, error, refetch } = useParentDiary(activeChildId);
  const [filter, setFilter] = useState('All');

  const items = useMemo(() => {
    const list: { date: string; item: DiaryItem }[] = [];
    for (const day of data?.dates ?? []) {
      for (const item of day.items ?? []) list.push({ date: day.date, item });
    }
    const subjects = ['All', ...new Set(list.map((row) => subjectOf(row.item)).filter(Boolean))];
    const filtered =
      filter === 'All' ? list : list.filter((row) => subjectOf(row.item) === filter);
    return { list: filtered.reverse(), subjects };
  }, [data, filter]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Diary</Text>
          <ChildSwitcher compact />
        </View>
        <Text style={styles.sub}>{activeChild ? `${activeChild.name} · homework & class updates` : 'Homework & class updates'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {items.subjects.map((subject) => (
            <Pressable
              key={subject}
              onPress={() => setFilter(subject)}
              style={[styles.pill, filter === subject && styles.pillActive]}
            >
              <Text style={[styles.pillText, filter === subject && styles.pillTextActive]}>{subject}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {!isLoading && items.list.length === 0 ? (
          <EmptyState title="No diary entries" subtitle="Check back after the next class update." icon="book-outline" />
        ) : (
          items.list.map((row, index) => (
            <Card
              key={`${row.date}-${row.item.title}-${index}`}
              style={{ marginBottom: 12 }}
              onPress={() => navigation.navigate('DiaryDetail', { date: row.date, item: row.item })}
            >
              <View style={styles.cardTop}>
                <Badge label={row.item.type} tone={row.item.type === 'assignment' ? 'warning' : 'primary'} />
                <Text style={styles.date}>{formatDate(row.date)}</Text>
              </View>
              <Text style={styles.itemTitle}>{row.item.title}</Text>
              {row.item.content ? (
                <Text numberOfLines={2} style={styles.content}>
                  {row.item.content}
                </Text>
              ) : null}
              <Text style={styles.meta}>{row.item.childName}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function subjectOf(item: DiaryItem) {
  const fromTitle = item.title.split(/[-–—:]/)[0]?.trim();
  return fromTitle || item.category || '';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.white, fontSize: 24, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.75)', marginTop: 6 },
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: colors.textMuted, fontSize: 12 },
  itemTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 10 },
  content: { color: colors.textMuted, marginTop: 6, lineHeight: 20 },
  meta: { color: colors.textMuted, marginTop: 10, fontSize: 12 },
});
