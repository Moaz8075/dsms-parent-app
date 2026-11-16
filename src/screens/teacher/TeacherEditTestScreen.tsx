import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { KeyboardScreen } from '../../components/KeyboardScreen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useUpdateTeacherTest } from '../../hooks/useTeacherQueries';
import { colors } from '../../theme';
import type { TestCard } from '../../api/teacher';

export function TeacherEditTestScreen({ navigation, route }: any) {
  const test: TestCard = route.params.test;
  const update = useUpdateTeacherTest();
  const [name, setName] = useState(test.testName);
  const [examDate, setExamDate] = useState((test.examDateRaw || '').slice(0, 10));
  const [maxMarks, setMaxMarks] = useState(String(test.maxMarks));
  const [passingMarks, setPassingMarks] = useState(String(test.passingMarks));

  const save = async () => {
    const max = Number(maxMarks);
    const pass = Number(passingMarks);
    if (!name.trim()) return Alert.alert('Add a name', 'The test needs a name.');
    if (!max || max < 1) return Alert.alert('Invalid marks', 'Max marks must be at least 1.');
    if (pass > max) return Alert.alert('Invalid marks', 'Passing marks cannot exceed max marks.');
    try {
      await update.mutateAsync({
        examSubjectId: test.examSubjectId,
        name: name.trim(),
        ...(examDate ? { examDate } : {}),
        maxMarks: max,
        passingMarks: pass,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not update test', err?.message || 'Try again.');
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardScreen
        header={<ScreenHeader title="Edit test" subtitle={`${test.classLabel} · ${test.subject}`} onBack={() => navigation.goBack()} />}
        contentContainerStyle={styles.body}
      >
        <Card>
          <Field label="Test name" value={name} onChangeText={setName} autoCapitalize="sentences" />
          <Field label="Exam date" value={examDate} onChangeText={setExamDate} placeholder="YYYY-MM-DD" />
          <Field label="Max marks" value={maxMarks} onChangeText={setMaxMarks} keyboardType="number-pad" />
          <Field label="Passing marks" value={passingMarks} onChangeText={setPassingMarks} keyboardType="number-pad" />
          <PrimaryButton title="Save changes" loading={update.isPending} onPress={save} />
        </Card>
      </KeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16 },
});
