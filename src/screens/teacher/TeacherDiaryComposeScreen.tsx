import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useCreateTeacherDiary, useTeacherDiary } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';
import { isoDate } from '../../utils/format';

export function TeacherDiaryComposeScreen({ navigation }: any) {
  const { data } = useTeacherDiary();
  const create = useCreateTeacherDiary();
  const classes = data?.classes ?? [];
  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState(isoDate());

  useEffect(() => {
    if (!classId && data?.classes?.[0]?.classId) setClassId(data.classes[0].classId);
  }, [classId, data?.classes]);

  const save = async () => {
    if (!classId) {
      Alert.alert('Choose a class', 'Pick the class this diary entry belongs to.');
      return;
    }
    if (title.trim().length < 2) {
      Alert.alert('Add a title', 'Parents will see this as the diary heading.');
      return;
    }
    try {
      await create.mutateAsync({
        classId,
        entryDate,
        title: title.trim(),
        content: content.trim() || undefined,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not save', err?.message || 'Try again.');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="New diary entry" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Card>
            <Text style={styles.label}>Class</Text>
            <View style={styles.wrapPills}>
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
            </View>
            <Field label="Date" icon="calendar-outline" value={entryDate} onChangeText={setEntryDate} placeholder="YYYY-MM-DD" />
            <Field
              label="Title"
              icon="create-outline"
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
              placeholder="Today’s class summary"
            />
            <Field
              label="Notes for parents"
              value={content}
              onChangeText={setContent}
              multiline
              autoCapitalize="sentences"
              placeholder="What was covered, homework, or reminders."
            />
            <PrimaryButton title="Publish to parents" loading={create.isPending} onPress={save} />
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
