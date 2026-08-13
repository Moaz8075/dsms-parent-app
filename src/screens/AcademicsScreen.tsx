import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useParentAcademics, useParentAttendance } from '../hooks/useParentQueries';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { Card } from '../components/Card';
import { MenuRow } from '../components/MenuRow';
import { colors } from '../theme';
import { addDays, isoDate } from '../utils/format';
import { splitAssessments } from '../utils/assessments';

export function AcademicsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { activeChildId, activeChild } = useAuth();
  const academics = useParentAcademics(activeChildId);
  const attendance = useParentAttendance(activeChildId, addDays(isoDate(), -90), isoDate());
  const split = splitAssessments(academics.data?.exams ?? []);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Academics</Text>
          <ChildSwitcher compact />
        </View>
        <Text style={styles.sub}>
          {activeChild ? `${activeChild.name} · tests, exams, and attendance` : 'Results and attendance'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Card>
          <Text style={styles.section}>Records</Text>
          <MenuRow
            icon="create-outline"
            color="#0EA5A4"
            title="Class Tests"
            subtitle={`${split.tests.length} published`}
            onPress={() => navigation.navigate('Tests')}
          />
          <MenuRow
            icon="school-outline"
            color="#7C3AED"
            title="Exams"
            subtitle={`${split.exams.length + split.other.length} published`}
            onPress={() => navigation.navigate('Exams')}
          />
          <MenuRow
            icon="document-text-outline"
            color={colors.success}
            title="Report Card"
            subtitle="Official term summary"
            onPress={() => navigation.navigate('ReportCard')}
          />
          <MenuRow
            icon="checkmark-circle-outline"
            color={colors.info}
            title="Attendance"
            subtitle={
              attendance.data?.summary
                ? `${attendance.data.summary.rate}% this term`
                : 'Daily present / absent'
            }
            onPress={() => navigation.navigate('Attendance')}
          />
        </Card>

        <Card style={{ marginTop: 16 }}>
          <View style={styles.avgRow}>
            <View>
              <Text style={styles.avgLabel}>Overall average</Text>
              <Text style={styles.avgValue}>{academics.data?.overallPerformance ?? 0}%</Text>
            </View>
            <Ionicons name="stats-chart" size={28} color={colors.primary} />
          </View>
          <Text style={styles.avgHint}>Open Tests or Exams to see the full subject-wise record.</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.white, fontSize: 24, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  body: { padding: 16, paddingBottom: 40 },
  section: {
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  avgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avgLabel: { color: colors.textMuted, fontWeight: '700' },
  avgValue: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 4 },
  avgHint: { color: colors.textMuted, marginTop: 10, lineHeight: 20 },
});
