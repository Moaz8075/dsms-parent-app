import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useCreateTeacherAnnouncement, useTeacherClasses } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';

const CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'ASSIGNMENT', label: 'Homework' },
  { value: 'EVENT', label: 'Event' },
  { value: 'HOLIDAY', label: 'Holiday' },
];

export function TeacherAnnouncementComposeScreen({ navigation }: any) {
  const { data } = useTeacherClasses();
  const create = useCreateTeacherAnnouncement();
  const classes = Array.from(
    new Map((data?.classes ?? []).map((item) => [item.classId, item])).values(),
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [targetClassId, setTargetClassId] = useState<string | 'ALL'>('ALL');

  const save = async () => {
    if (title.trim().length < 3) {
      Alert.alert('Add a title', 'Keep it short so parents can scan it quickly.');
      return;
    }
    if (content.trim().length < 10) {
      Alert.alert('Add more detail', 'Write at least a short note for families.');
      return;
    }
    const uniqueClass = classes.find((item) => item.classId === targetClassId);
    try {
      await create.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        category,
        publishMode: 'publish',
        targets:
          targetClassId === 'ALL' || !uniqueClass
            ? [{ targetType: 'ALL' }]
            : [{ targetType: 'CLASS', targetId: uniqueClass.classId }],
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not publish', err?.message || 'Try again.');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="New announcement" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Card>
            <Field label="Title" value={title} onChangeText={setTitle} autoCapitalize="sentences" placeholder="Math quiz tomorrow" />
            <Text style={styles.label}>Category</Text>
            <View style={styles.wrapPills}>
              {CATEGORIES.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setCategory(item.value)}
                  style={[styles.pill, category === item.value && styles.pillActive]}
                >
                  <Text style={[styles.pillText, category === item.value && styles.pillTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Audience</Text>
            <View style={styles.wrapPills}>
              <Pressable
                onPress={() => setTargetClassId('ALL')}
                style={[styles.pill, targetClassId === 'ALL' && styles.pillActive]}
              >
                <Text style={[styles.pillText, targetClassId === 'ALL' && styles.pillTextActive]}>Whole school</Text>
              </Pressable>
              {classes.map((item) => (
                <Pressable
                  key={item.classId}
                  onPress={() => setTargetClassId(item.classId)}
                  style={[styles.pill, targetClassId === item.classId && styles.pillActive]}
                >
                  <Text style={[styles.pillText, targetClassId === item.classId && styles.pillTextActive]}>
                    {item.grade}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Field
              label="Message"
              value={content}
              onChangeText={setContent}
              multiline
              autoCapitalize="sentences"
              placeholder="Write the notice parents should see."
            />
            <PrimaryButton title="Publish" loading={create.isPending} onPress={save} />
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
