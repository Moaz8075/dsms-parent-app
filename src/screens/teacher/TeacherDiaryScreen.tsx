import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { useTeacherDiary } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';
import { addDays, formatDate, isoDate } from '../../utils/format';

export function TeacherDiaryScreen({ navigation }: any) {
  const [classId, setClassId] = useState<string | undefined>();
  const { data, isLoading, isError, error, refetch } = useTeacherDiary({
    classId,
    from: addDays(isoDate(), -14),
    to: addDays(isoDate(), 14),
  });
  const classes = data?.classes ?? [];
  const entries = useMemo(() => data?.entries ?? [], [data]);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Class Diary"
        subtitle="Notes parents will see"
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={() => navigation.navigate('TeacherDiaryCompose')} hitSlop={8}>
            <Ionicons name="add" size={24} color={colors.white} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.body}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <Pressable onPress={() => setClassId(undefined)} style={[styles.pill, !classId && styles.pillActive]}>
            <Text style={[styles.pillText, !classId && styles.pillTextActive]}>All</Text>
          </Pressable>
          {classes.map((item) => (
            <Pressable
              key={item.classId}
              onPress={() => setClassId(item.classId)}
              style={[styles.pill, classId === item.classId && styles.pillActive]}
            >
              <Text style={[styles.pillText, classId === item.classId && styles.pillTextActive]}>
                {item.gradeLabel || item.className}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {!isLoading && entries.length === 0 ? (
          <EmptyState title="No diary entries" subtitle="Write today’s class summary for parents." icon="book-outline" />
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} style={{ marginBottom: 12 }}>
              <View style={styles.rowBetween}>
                <Badge label={entry.gradeLabel || entry.className} />
                <Text style={styles.date}>{formatDate(entry.entryDate)}</Text>
              </View>
              <Text style={styles.title}>{entry.title}</Text>
              {entry.content ? (
                <Text style={styles.content} numberOfLines={3}>
                  {entry.content}
                </Text>
              ) : null}
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
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: colors.textMuted, fontSize: 12 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 10 },
  content: { color: colors.textMuted, marginTop: 6, lineHeight: 20 },
});
