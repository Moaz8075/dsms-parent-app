import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Field } from '../components/Field';
import { KeyboardScreen } from '../components/KeyboardScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { ErrorState, LoadingState } from '../components/States';
import { useComplaint, useReplyToComplaint } from '../hooks/useComplaints';
import { COMPLAINT_STATUS } from './ComplaintsScreen';
import { colors } from '../theme';
import { toUserMessage } from '../utils/errors';

export function ComplaintDetailScreen({ navigation, route }: any) {
  const id = route?.params?.id as string;
  const { data: c, isLoading, isError, error, refetch } = useComplaint(id);
  const reply = useReplyToComplaint();
  const [text, setText] = useState('');

  const send = async () => {
    if (!text.trim()) return;
    try {
      await reply.mutateAsync({ id, message: text.trim() });
      setText('');
    } catch (e) {
      Alert.alert('Could not send', toUserMessage(e));
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title={c?.complaintNumber ?? 'Complaint'} subtitle={c?.categoryLabel} onBack={() => navigation.goBack()} />
      <KeyboardScreen>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {isLoading ? <LoadingState /> : null}
          {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
          {c ? (
            <>
              <Card style={{ marginBottom: 12 }}>
                <View style={styles.row}>
                  <Text style={styles.subject}>{c.subject}</Text>
                  <Badge label={COMPLAINT_STATUS[c.status].label} tone={COMPLAINT_STATUS[c.status].tone} />
                </View>
                {c.studentName ? <Text style={styles.meta}>About {c.studentName}</Text> : null}
                <Text style={styles.meta}>Raised {c.createdLabel}</Text>
                <Text style={styles.body1}>{c.description}</Text>
              </Card>

              {c.messages.map((m) => (
                <Card key={m.id} style={{ marginBottom: 10, ...(m.authorRole === 'STAFF' ? styles.staff : {}) }}>
                  <Text style={styles.author}>{m.authorName} · {m.authorRole === 'STAFF' ? 'School' : 'You'}</Text>
                  <Text style={styles.body1}>{m.message}</Text>
                </Card>
              ))}

              {c.resolutionNote ? (
                <Card style={styles.resolved}>
                  <Text style={styles.author}>Resolution</Text>
                  <Text style={styles.body1}>{c.resolutionNote}</Text>
                </Card>
              ) : null}

              {c.status === 'CLOSED' ? (
                <Text style={styles.closed}>This complaint is closed. If the problem continues, please raise a new one.</Text>
              ) : (
                <View style={{ marginTop: 12 }}>
                  <Field label="Add a reply" value={text} onChangeText={setText} placeholder="Write a reply or add more information" multiline maxLength={2000} autoCapitalize="sentences" />
                  <PrimaryButton title="Send reply" icon="send-outline" loading={reply.isPending} onPress={send} />
                  {c.status === 'RESOLVED' ? <Text style={styles.hint}>Replying will re-open this complaint.</Text> : null}
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
      </KeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  subject: { flex: 1, fontWeight: '800', color: colors.text, fontSize: 17 },
  meta: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
  body1: { color: colors.text, marginTop: 10, lineHeight: 21 },
  author: { fontWeight: '800', color: colors.textMuted, fontSize: 12 },
  staff: { borderLeftWidth: 3, borderLeftColor: colors.success },
  resolved: { backgroundColor: colors.successSoft, marginTop: 4 },
  closed: { color: colors.textMuted, marginTop: 12, textAlign: 'center' },
  hint: { color: colors.textMuted, marginTop: 8, fontSize: 12 },
});
