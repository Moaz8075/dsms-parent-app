import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { useSaveTeacherMarkSheet, useTeacherMarkSheet } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';

type RowState = { marks: string; absent: boolean };

export function TeacherMarksheetScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { examSubjectId } = route.params;
  const { data, isLoading, isError, error, refetch } = useTeacherMarkSheet(examSubjectId);
  const save = useSaveTeacherMarkSheet();
  const [rows, setRows] = useState<Record<string, RowState>>({});

  useEffect(() => {
    if (!data?.rows) return;
    const next: Record<string, RowState> = {};
    for (const row of data.rows) {
      next[row.studentId] = {
        marks: row.marksObtained == null ? '' : String(row.marksObtained),
        absent: Boolean(row.isAbsent),
      };
    }
    setRows(next);
  }, [data]);

  const update = (studentId: string, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  };

  const submit = async () => {
    const records = (data?.rows ?? []).map((row) => {
      const state = rows[row.studentId] || { marks: '', absent: false };
      if (state.absent) return { studentId: row.studentId, isAbsent: true };
      const marks = state.marks.trim() === '' ? null : Number(state.marks);
      return {
        studentId: row.studentId,
        isAbsent: false,
        marksObtained: Number.isFinite(marks) ? marks : null,
      };
    });
    try {
      await save.mutateAsync({ examSubjectId, records });
      Alert.alert('Saved', 'Marks were updated.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Save failed', err?.message || 'Try again.');
    }
  };

  const header = data?.header;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={header?.testName || 'Mark sheet'}
        subtitle={header ? `${header.classLabel} · ${header.subject}` : undefined}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 100 + insets.bottom }]}>
          {isLoading ? <LoadingState /> : null}
          {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
          {header ? (
            <Text style={styles.hint}>
              Max {header.maxMarks} · Pass {header.passingMarks} · {data?.summary?.marked ?? 0}/{data?.summary?.total ?? 0} marked
            </Text>
          ) : null}
          {(data?.rows ?? []).length === 0 && !isLoading ? (
            <EmptyState title="No students to mark" />
          ) : (
            (data?.rows ?? []).map((row) => {
              const state = rows[row.studentId] || { marks: '', absent: false };
              return (
                <Card key={row.studentId} style={{ marginBottom: 10 }}>
                  <View style={styles.top}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{row.name}</Text>
                      <Text style={styles.meta}>Roll {row.rollNumber || '—'}</Text>
                    </View>
                    {row.grade ? <Badge label={row.grade} /> : null}
                  </View>
                  <View style={styles.row}>
                    <TextInput
                      value={state.absent ? '' : state.marks}
                      onChangeText={(marks) => update(row.studentId, { marks, absent: false })}
                      keyboardType="number-pad"
                      placeholder={`0–${header?.maxMarks ?? 100}`}
                      placeholderTextColor={colors.textMuted}
                      editable={!state.absent}
                      style={[styles.input, state.absent && styles.inputDisabled]}
                    />
                    <Pressable
                      onPress={() => update(row.studentId, { absent: !state.absent, marks: '' })}
                      style={[styles.absent, state.absent && styles.absentOn]}
                    >
                      <Text style={[styles.absentText, state.absent && styles.absentTextOn]}>Absent</Text>
                    </Pressable>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <PrimaryButton title="Save marks" loading={save.isPending} onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16 },
  hint: { color: colors.textMuted, marginBottom: 14, fontWeight: '600' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '800', color: colors.text },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  input: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    color: colors.text,
    fontWeight: '700',
  },
  inputDisabled: { opacity: 0.45 },
  absent: {
    minWidth: 88,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  absentOn: { backgroundColor: colors.danger, borderColor: colors.danger },
  absentText: { fontWeight: '800', color: colors.textMuted },
  absentTextOn: { color: colors.white },
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
