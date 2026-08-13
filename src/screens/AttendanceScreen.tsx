import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge, statusTone } from '../components/Badge';
import { ProgressRing } from '../components/ProgressRing';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useParentAttendance } from '../hooks/useParentQueries';
import { colors } from '../theme';
import { addDays, formatDate, isoDate } from '../utils/format';

export function AttendanceScreen({ navigation }: any) {
  const { activeChildId, activeChild } = useAuth();
  const { data, isLoading, isError, error, refetch } = useParentAttendance(
    activeChildId,
    addDays(isoDate(), -90),
    isoDate(),
  );
  const summary = data?.summary ?? { rate: 0, present: 0, absent: 0, late: 0, total: 0 };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Attendance"
        subtitle={activeChild ? `${activeChild.name} · ${data?.className ?? ''}` : undefined}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.body}>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        <Card style={{ alignItems: 'center' }}>
          <ProgressRing percent={summary.rate} />
          <View style={styles.stats}>
            <Stat label="Present" value={summary.present} />
            <Stat label="Absent" value={summary.absent} />
            <Stat label="Late" value={summary.late} />
          </View>
        </Card>
        <Text style={styles.section}>Recent records</Text>
        {(data?.records ?? []).length === 0 && !isLoading ? (
          <EmptyState title="No attendance records" />
        ) : (
          [...(data?.records ?? [])].reverse().map((row) => (
            <Card key={row.date} style={{ marginBottom: 8 }}>
              <View style={styles.row}>
                <Text style={styles.date}>{formatDate(row.date)}</Text>
                <Badge label={row.status} tone={statusTone(row.status)} />
              </View>
              {row.notes ? <Text style={styles.notes}>{row.notes}</Text> : null}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.notes}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  stats: { flexDirection: 'row', width: '100%', marginTop: 16 },
  statValue: { fontWeight: '800', fontSize: 18, color: colors.text },
  section: { fontWeight: '800', marginTop: 20, marginBottom: 10, color: colors.text, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontWeight: '700', color: colors.text },
  notes: { color: colors.textMuted, marginTop: 4 },
});
