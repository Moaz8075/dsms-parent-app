import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useDateSheet } from '../hooks/useParentQueries';
import { useTeacherDateSheet } from '../hooks/useTeacherQueries';
import { colors, radius } from '../theme';

/** Published exam date sheet. Students and parents see their class; teachers see the classes they teach. */
export function DateSheetScreen({ navigation }: any) {
  const { isTeacher, activeChildId, activeChild } = useAuth();
  const mine = useTeacherDateSheet();
  const child = useDateSheet(isTeacher ? null : activeChildId);
  const q: any = isTeacher ? mine : child;
  const exams: any[] = q.data?.exams ?? [];

  return (
    <View style={styles.root}>
      <ScreenHeader title="Exam date sheet" subtitle={isTeacher ? undefined : activeChild?.name} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} refreshControl={<RefreshControl refreshing={Boolean(q.isRefetching)} onRefresh={() => q.refetch()} />}>
        {q.isLoading ? <LoadingState /> : null}
        {q.isError ? <ErrorState message={(q.error as Error)?.message} onRetry={() => q.refetch()} /> : null}
        {!q.isLoading && !q.isError && exams.length === 0 ? (
          <EmptyState title="No date sheet yet" subtitle="When the school publishes an exam date sheet, it will appear here." />
        ) : null}
        {exams.map((e) => (
          <View key={e.id} style={{ gap: 8 }}>
            <View style={styles.examHead}>
              <Text style={styles.examName}>{e.name}</Text>
              <Text style={styles.examMeta}>
                {e.typeLabel}{e.startLabel ? ` · ${e.startLabel}${e.endLabel && e.endLabel !== e.startLabel ? ` – ${e.endLabel}` : ''}` : ''}
              </Text>
            </View>
            {e.papers.map((p: any) => {
              const d = p.date ? new Date(p.date) : null;
              return (
                <Card key={p.id} style={StyleSheet.flatten([styles.row, !p.upcoming && { opacity: 0.6 }, p.mine && styles.mine])}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateSmall}>{d ? d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase() : ''}</Text>
                    <Text style={styles.dateBig}>{d ? d.getUTCDate() : '–'}</Text>
                    <Text style={styles.dateSmall}>{p.dayLabel ? p.dayLabel.slice(0, 3).toUpperCase() : ''}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subject}>{p.subject}</Text>
                    <Text style={styles.sub}>
                      {isTeacher && p.className ? `${p.className} · ` : ''}Total {p.maxMarks}{p.passingMarks != null ? `, pass ${p.passingMarks}` : ''}
                    </Text>
                  </View>
                  {p.mine ? <Text style={styles.tag}>Your subject</Text> : !p.upcoming ? <Text style={[styles.tag, styles.tagPast]}>Done</Text> : null}
                </Card>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, gap: 18, paddingBottom: 32 },
  examHead: { paddingHorizontal: 2 },
  examName: { fontSize: 17, fontWeight: '800', color: colors.text },
  examMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mine: { borderColor: colors.primary, borderWidth: 1 },
  dateBox: { width: 52, alignItems: 'center', backgroundColor: '#E6EDFD', borderRadius: radius.md, paddingVertical: 6 },
  dateSmall: { fontSize: 10, fontWeight: '700', color: '#1D4ED8', letterSpacing: 0.5 },
  dateBig: { fontSize: 20, fontWeight: '800', color: '#1D4ED8' },
  subject: { fontSize: 15, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tag: { fontSize: 11, fontWeight: '700', color: colors.primary, backgroundColor: '#E3F3F1', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, overflow: 'hidden' },
  tagPast: { color: colors.textMuted, backgroundColor: '#EEF1F4' },
});
