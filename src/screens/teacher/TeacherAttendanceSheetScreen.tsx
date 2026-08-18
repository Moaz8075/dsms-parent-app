import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { useSaveTeacherAttendance, useTeacherAttendanceSheet } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';

const STATUSES = [
  { key: 'PRESENT', label: 'Present', color: colors.success },
  { key: 'ABSENT', label: 'Absent', color: colors.danger },
] as const;

type StatusKey = (typeof STATUSES)[number]['key'];

function toMarkStatus(status?: string | null): StatusKey | null {
  if (status === 'PRESENT' || status === 'LATE') return 'PRESENT';
  if (status === 'ABSENT' || status === 'EXCUSED' || status === 'HALF_DAY') return 'ABSENT';
  return null;
}

export function TeacherAttendanceSheetScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { classId, date } = route.params;
  const { data, isLoading, isError, error, refetch } = useTeacherAttendanceSheet(classId, date);
  const save = useSaveTeacherAttendance();
  const [marks, setMarks] = useState<Record<string, StatusKey>>({});

  useEffect(() => {
    if (!data?.students) return;
    const next: Record<string, StatusKey> = {};
    for (const student of data.students) {
      const mapped = toMarkStatus(student.status);
      if (mapped) next[student.studentId] = mapped;
    }
    setMarks(next);
  }, [data]);

  const markedCount = Object.keys(marks).length;
  const summary = useMemo(() => {
    const values = Object.values(marks);
    return {
      present: values.filter((v) => v === 'PRESENT').length,
      absent: values.filter((v) => v === 'ABSENT').length,
      late: values.filter((v) => v === 'LATE').length,
    };
  }, [marks]);

  const markAllPresent = () => {
    const next: Record<string, StatusKey> = {};
    for (const student of data?.students ?? []) next[student.studentId] = 'PRESENT';
    setMarks(next);
  };

  const submit = async () => {
    const records = Object.entries(marks).map(([studentId, status]) => ({ studentId, status }));
    if (!records.length) {
      Alert.alert('Nothing to save', 'Tap Present or Absent for each student first.');
      return;
    }
    try {
      await save.mutateAsync({ classId, date: data?.date || date, records });
      Alert.alert('Saved', `Attendance saved for ${records.length} students.`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Save failed', err?.message || 'Try again.');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={data?.class?.gradeLabel || data?.class?.name || 'Mark attendance'}
        subtitle={data?.dateLabel || date}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 100 + insets.bottom }]}>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {markedCount}/{data?.summary?.total ?? 0} marked · {summary.present} present · {summary.absent} absent
          </Text>
          <Pressable onPress={markAllPresent}>
            <Text style={styles.link}>Mark all present</Text>
          </Pressable>
        </View>
        {(data?.students ?? []).length === 0 && !isLoading ? (
          <EmptyState title="No students in this class" />
        ) : (
          (data?.students ?? []).map((student) => (
            <Card key={student.studentId} style={{ marginBottom: 10 }}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{student.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{student.name}</Text>
                  <Text style={styles.meta}>Roll {student.rollNumber || '—'}</Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                {STATUSES.map((status) => {
                  const active = marks[student.studentId] === status.key;
                  return (
                    <Pressable
                      key={status.key}
                      onPress={() => setMarks((prev) => ({ ...prev, [student.studentId]: status.key }))}
                      style={[
                        styles.statusBtn,
                        active && { backgroundColor: status.color, borderColor: status.color },
                      ]}
                    >
                      <Text style={[styles.statusLabel, active && styles.statusLabelActive]}>{status.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <PrimaryButton title="Save attendance" loading={save.isPending} onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  summaryText: { color: colors.textMuted, flex: 1, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  name: { fontWeight: '800', color: colors.text },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statusBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  statusLabel: { fontWeight: '800', color: colors.textMuted },
  statusLabelActive: { color: colors.white },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
