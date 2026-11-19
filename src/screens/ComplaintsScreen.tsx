import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Field } from '../components/Field';
import { KeyboardScreen } from '../components/KeyboardScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useComplaints, useCreateComplaint } from '../hooks/useComplaints';
import { COMPLAINT_CATEGORIES } from '../api/complaints';
import type { ComplaintStatus } from '../api/complaints';
import { colors, radius } from '../theme';
import { toUserMessage } from '../utils/errors';

export const COMPLAINT_STATUS: Record<ComplaintStatus, { label: string; tone: 'info' | 'warning' | 'success' | 'muted' }> = {
  OPEN: { label: 'Open', tone: 'info' },
  IN_REVIEW: { label: 'In review', tone: 'warning' },
  RESOLVED: { label: 'Resolved', tone: 'success' },
  CLOSED: { label: 'Closed', tone: 'muted' },
};

/** Raise a complaint to the school's Principal and follow what happens. Used by parents and teachers. */
export function ComplaintsScreen({ navigation }: any) {
  const { isTeacher: teacher, isStudent, activeChildId, activeChild } = useAuth();
  const isTeacher = teacher || isStudent; // no child to choose: teachers and students raise their own complaints
  const { data, isLoading, isError, error, refetch } = useComplaints();
  const create = useCreateComplaint();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const submit = async () => {
    if (!category) return Alert.alert('Choose a topic', 'What is your complaint about?');
    if (subject.trim().length < 3) return Alert.alert('Add a title', 'Please give your complaint a short title.');
    if (description.trim().length < 10) return Alert.alert('Add details', 'Please describe the problem in a sentence or two.');
    if (!isTeacher && !activeChildId) return Alert.alert('Choose a child', 'Select the child this is about first.');
    try {
      const made = await create.mutateAsync({ category, subject: subject.trim(), description: description.trim(), ...(isTeacher ? {} : { childId: activeChildId as string }) });
      setCategory(''); setSubject(''); setDescription(''); setShowForm(false);
      Alert.alert('Complaint sent', `${made.complaintNumber} has gone to the school. You will see their reply here.`);
    } catch (e) {
      Alert.alert('Could not send', toUserMessage(e));
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Complaints" subtitle={!isTeacher && activeChild ? `About ${activeChild.name}` : 'Goes to the Principal'} onBack={() => navigation.goBack()} />
      <KeyboardScreen>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {showForm ? (
            <Card style={{ marginBottom: 16 }}>
              <Text style={styles.formTitle}>Raise a complaint</Text>
              <Text style={styles.label}>What is it about?</Text>
              <View style={styles.chips}>
                {COMPLAINT_CATEGORIES.map((c) => (
                  <Pressable key={c.value} onPress={() => setCategory(c.value)} style={[styles.chip, category === c.value && styles.chipOn]}>
                    <Text style={[styles.chipText, category === c.value && styles.chipTextOn]}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Field label="Short title" value={subject} onChangeText={setSubject} placeholder="e.g. School bus is always late" maxLength={120} autoCapitalize="sentences" />
              <Field label="Details" value={description} onChangeText={setDescription} placeholder="What happened, when, and what would you like the school to do?" multiline maxLength={2000} autoCapitalize="sentences" />
              <PrimaryButton title="Submit complaint" loading={create.isPending} onPress={submit} />
              <View style={{ height: 8 }} />
              <PrimaryButton title="Cancel" variant="outline" onPress={() => setShowForm(false)} />
            </Card>
          ) : (
            <PrimaryButton title="Raise a complaint" icon="add-circle-outline" onPress={() => setShowForm(true)} />
          )}

          <Text style={styles.section}>My complaints</Text>
          {isLoading ? <LoadingState /> : null}
          {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
          {!isLoading && !isError && (data ?? []).length === 0 ? <EmptyState title="No complaints yet" subtitle="If something is wrong, tell the school here. We will keep you updated." /> : null}
          {(data ?? []).map((c) => (
            <Pressable key={c.id} onPress={() => navigation.navigate('ComplaintDetail', { id: c.id })}>
              <Card style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subject}>{c.subject}</Text>
                    <Text style={styles.meta}>{c.complaintNumber} · {c.categoryLabel}{c.studentName ? ` · ${c.studentName}` : ''}</Text>
                    <Text style={styles.meta}>Raised {c.createdLabel}{c.messageCount ? ` · ${c.messageCount} repl${c.messageCount === 1 ? 'y' : 'ies'}` : ''}</Text>
                  </View>
                  <Badge label={COMPLAINT_STATUS[c.status].label} tone={COMPLAINT_STATUS[c.status].tone} />
                </View>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      </KeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  formTitle: { fontWeight: '800', fontSize: 17, color: colors.text, marginBottom: 12 },
  label: { color: colors.text, fontWeight: '600', marginBottom: 8, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: colors.white },
  section: { marginTop: 20, marginBottom: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  subject: { fontWeight: '800', color: colors.text, fontSize: 15 },
  meta: { color: colors.textMuted, marginTop: 3, fontSize: 12 },
});
