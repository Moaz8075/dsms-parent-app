import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Badge, statusTone } from '../../components/Badge';
import { ProgressRing } from '../../components/ProgressRing';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import {
  useStudentProfile,
  useTeacherStudentAttendance,
  useTeacherStudentReportCard,
} from '../../hooks/useTeacherQueries';
import { colors } from '../../theme';
import { formatDate, formatMonth, initials, isoMonth, shiftMonth } from '../../utils/format';

export function TeacherStudentDetailScreen({ navigation, route }: any) {
  const { studentId, name, grade, avatar } = route.params;
  const [month, setMonth] = useState(isoMonth());
  const profile = useStudentProfile(studentId);
  const attendance = useTeacherStudentAttendance(studentId, month);
  const report = useTeacherStudentReportCard(studentId);
  const summary = attendance.data?.summary ?? { rate: 0, present: 0, absent: 0, late: 0 };

  return (
    <View style={styles.root}>
      <ScreenHeader title={name} subtitle={grade} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatar || initials(name)}</Text>
          </View>
          <Text style={styles.name}>{profile.data?.profile?.name || name}</Text>
          <Text style={styles.meta}>
            {profile.data?.profile?.studentId || ''} {profile.data?.profile?.classSection || grade}
          </Text>
        </View>

        <Card style={{ alignItems: 'center', marginBottom: 16 }}>
          <View style={styles.monthRow}>
            <Pressable onPress={() => setMonth((m) => shiftMonth(m, -1))} style={styles.monthBtn}>
              <Text style={styles.monthNav}>‹</Text>
            </Pressable>
            <Text style={styles.month}>{formatMonth(month)}</Text>
            <Pressable onPress={() => setMonth((m) => shiftMonth(m, 1))} style={styles.monthBtn}>
              <Text style={styles.monthNav}>›</Text>
            </Pressable>
          </View>
          {attendance.isLoading ? <LoadingState /> : null}
          {attendance.isError ? (
            <ErrorState message={(attendance.error as Error)?.message} onRetry={() => attendance.refetch()} />
          ) : null}
          <ProgressRing percent={summary.rate} />
          <View style={styles.stats}>
            <Stat label="Present" value={summary.present} />
            <Stat label="Absent" value={summary.absent} />
            <Stat label="Late" value={summary.late} />
          </View>
        </Card>

        <Text style={styles.section}>This month</Text>
        {(attendance.data?.records ?? []).length === 0 && !attendance.isLoading ? (
          <EmptyState title="No attendance yet" />
        ) : (
          [...(attendance.data?.records ?? [])].reverse().slice(0, 12).map((row) => (
            <Card key={row.date} style={{ marginBottom: 8 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.date}>{formatDate(row.date)}</Text>
                <Badge label={row.status} tone={statusTone(row.status)} />
              </View>
            </Card>
          ))
        )}

        <Text style={styles.section}>Report card</Text>
        {report.isLoading ? <LoadingState /> : null}
        {report.data ? (
          <Card>
            <Text style={styles.meta}>
              {report.data.className || report.data.class?.name || grade}
            </Text>
            {report.data.percentage != null ? (
              <Text style={styles.percent}>{report.data.percentage}%</Text>
            ) : (
              <Text style={styles.meta}>No published report card for this year yet.</Text>
            )}
            {report.data.remarks ? <Text style={styles.meta}>{report.data.remarks}</Text> : null}
          </Card>
        ) : (
          <EmptyState title="No report card" />
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.meta}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 26, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 10 },
  meta: { color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  monthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  monthBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthNav: { fontSize: 24, color: colors.primary, fontWeight: '700' },
  month: { flex: 1, textAlign: 'center', fontWeight: '800', color: colors.text },
  stats: { flexDirection: 'row', width: '100%', marginTop: 16 },
  statValue: { fontWeight: '800', fontSize: 18, color: colors.text },
  section: { fontWeight: '800', marginTop: 18, marginBottom: 10, color: colors.text, fontSize: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontWeight: '700', color: colors.text },
  percent: { fontSize: 28, fontWeight: '800', color: colors.primary, marginTop: 8, textAlign: 'center' },
});
