import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { PrimaryButton } from '../../components/PrimaryButton';
import { LoadingState } from '../../components/States';
import { useCreateTeacherTest, useCreateTestOptions } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';
import { isoDate } from '../../utils/format';

export function TeacherCreateTestScreen({ navigation }: any) {
  const { data, isLoading } = useCreateTestOptions();
  const create = useCreateTeacherTest();
  const [name, setName] = useState('');
  const [type, setType] = useState('UNIT_TEST');
  const [classSubjectKey, setClassSubjectKey] = useState('');
  const [examDate, setExamDate] = useState(isoDate());
  const [maxMarks, setMaxMarks] = useState(String(data?.defaults?.maxMarks ?? 100));
  const [passingMarks, setPassingMarks] = useState(String(data?.defaults?.passingMarks ?? 40));
  const [description, setDescription] = useState('');

  const selected = (data?.classSubjects ?? []).find((item) => item.key === classSubjectKey) ?? data?.classSubjects?.[0];

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Add a name', 'For example: Unit Test 3.');
      return;
    }
    if (!selected) {
      Alert.alert('Choose a class', 'Pick the class and subject for this test.');
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        type,
        classId: selected.classId,
        subjectId: selected.subjectId,
        examDate,
        maxMarks: Number(maxMarks) || 100,
        passingMarks: Number(passingMarks) || 40,
        description: description.trim() || undefined,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not create test', err?.message || 'Try again.');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Create test" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {isLoading ? <LoadingState /> : null}
          <Card>
            <Field label="Test name" value={name} onChangeText={setName} autoCapitalize="sentences" placeholder="Unit Test 3" />
            <Text style={styles.label}>Type</Text>
            <View style={styles.wrapPills}>
              {(data?.examTypes ?? []).map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setType(item.value)}
                  style={[styles.pill, type === item.value && styles.pillActive]}
                >
                  <Text style={[styles.pillText, type === item.value && styles.pillTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Class & subject</Text>
            <View style={styles.wrapPills}>
              {(data?.classSubjects ?? []).map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => setClassSubjectKey(item.key)}
                  style={[styles.pill, (classSubjectKey || selected?.key) === item.key && styles.pillActive]}
                >
                  <Text style={[styles.pillText, (classSubjectKey || selected?.key) === item.key && styles.pillTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Field label="Exam date" value={examDate} onChangeText={setExamDate} placeholder="YYYY-MM-DD" />
            <Field label="Max marks" value={maxMarks} onChangeText={setMaxMarks} keyboardType="number-pad" />
            <Field label="Passing marks" value={passingMarks} onChangeText={setPassingMarks} keyboardType="number-pad" />
            <Field
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              autoCapitalize="sentences"
              placeholder="Chapters or instructions (optional)"
            />
            <PrimaryButton title="Create test" loading={create.isPending} onPress={save} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  label: { color: colors.text, fontWeight: '600', marginBottom: 8, fontSize: 14 },
  wrapPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontWeight: '700', color: colors.text },
  pillTextActive: { color: colors.white },
});
