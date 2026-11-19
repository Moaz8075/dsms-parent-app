import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { useMyStaffAttendance } from '../../hooks/useFamily';
import { colors } from '../../theme';

const TONE: Record<string, 'success' | 'danger' | 'warning' | 'info'> = { PRESENT: 'success', ABSENT: 'danger', LATE: 'warning', HALF_DAY: 'warning', EXCUSED: 'info' };
const LABEL: Record<string, string> = { PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late', HALF_DAY: 'Half day', EXCUSED: 'Leave' };

/** A teacher's own attendance for this month, as marked by the school. */
export function TeacherMyAttendanceScreen({ navigation }: any) {
  const { data, isLoading, isError, error, refetch } = useMyStaffAttendance();
  const s = data?.summary;
  return (
    <View style={styles.root}>
      <ScreenHeader title="My Attendance" subtitle="This month" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {s ? (
          <Card style={styles.hero}>
            <Text style={styles.heroValue}>{s.rate}%</Text>
            <Text style={styles.heroSub}>Present {s.present} · Absent {s.absent} · Late {s.late} · Leave {s.excused}</Text>
          </Card>
        ) : null}
        {data && data.records.length === 0 ? <EmptyState title="No records yet" subtitle="Your attendance appears here once the school marks it." /> : null}
        {(data?.records ?? []).map((r) => (
          <Card key={r.id} style={{ marginBottom: 10 }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.date}>{r.date}</Text>
                {r.checkIn || r.checkOut ? <Text style={styles.meta}>{r.checkIn ?? '—'} → {r.checkOut ?? '—'}</Text> : null}
                {r.notes ? <Text style={styles.meta}>{r.notes}</Text> : null}
              </View>
              <Badge label={LABEL[r.status] ?? r.status} tone={TONE[r.status] ?? 'muted' as any} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  hero: { backgroundColor: colors.primary, marginBottom: 16 },
  heroValue: { color: colors.white, fontSize: 36, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  date: { fontWeight: '800', color: colors.text },
  meta: { color: colors.textMuted, marginTop: 3, fontSize: 12 },
});
