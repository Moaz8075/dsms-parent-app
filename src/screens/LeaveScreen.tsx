import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge, statusTone } from '../components/Badge';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import {
  useCancelLeaveRequest,
  useCreateLeaveRequest,
  useParentLeaveRequests,
} from '../hooks/useParentQueries';
import { colors, radius } from '../theme';
import { addDays, daysBetween, formatDate, isoDate } from '../utils/format';

export function LeaveScreen({ navigation }: any) {
  const { activeChildId, activeChild } = useAuth();
  const { data, isLoading, isError, error, refetch } = useParentLeaveRequests();
  const createLeave = useCreateLeaveRequest();
  const cancelLeave = useCancelLeaveRequest();
  const [startDate, setStartDate] = useState(isoDate());
  const [endDate, setEndDate] = useState(addDays(isoDate(), 1));
  const [reason, setReason] = useState('');

  const days = useMemo(() => Math.max(1, daysBetween(startDate, endDate)), [startDate, endDate]);

  const submit = async () => {
    if (!activeChildId) return;
    if (reason.trim().length < 3) {
      Alert.alert('Reason required', 'Please explain why leave is needed.');
      return;
    }
    try {
      await createLeave.mutateAsync({ childId: activeChildId, startDate, endDate, reason: reason.trim() });
      setReason('');
      Alert.alert('Submitted', 'Your leave request was sent to the class teacher.');
    } catch (err: any) {
      Alert.alert('Could not submit', err?.message || 'Try again.');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Leave Requests"
        subtitle={activeChild ? `${activeChild.name} · ${activeChild.grade}` : undefined}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <Card>
          <Text style={styles.label}>Selected range</Text>
          <Text style={styles.range}>
            {formatDate(startDate)} – {formatDate(endDate)} · {days} day{days > 1 ? 's' : ''}
          </Text>
          <View style={styles.quick}>
            <Chip label="Tomorrow" onPress={() => { const d = addDays(isoDate(), 1); setStartDate(d); setEndDate(d); }} />
            <Chip label="3 days" onPress={() => { setStartDate(isoDate()); setEndDate(addDays(isoDate(), 2)); }} />
            <Chip label="Next week" onPress={() => { setStartDate(addDays(isoDate(), 7)); setEndDate(addDays(isoDate(), 9)); }} />
          </View>
          <Field label="Start date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
          <Field label="End date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />
          <Field
            label="Reason for leave"
            value={reason}
            onChangeText={setReason}
            placeholder="Family event, illness, travel…"
            multiline
          />
          <PrimaryButton title="Submit to class teacher" loading={createLeave.isPending} onPress={submit} />
        </Card>

        <Text style={styles.section}>Request history</Text>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {(data?.requests ?? []).length === 0 && !isLoading ? (
          <EmptyState title="No leave requests" icon="calendar-outline" />
        ) : (
          data?.requests.map((req) => (
            <Card key={req.id} style={{ marginBottom: 10 }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{req.childName}</Text>
                  <Text style={styles.meta}>
                    {formatDate(req.startDate)} – {formatDate(req.endDate)}
                  </Text>
                  <Text style={styles.meta}>{req.reason}</Text>
                </View>
                <Badge label={req.status} tone={statusTone(req.status)} />
              </View>
              {req.status === 'PENDING' ? (
                <Pressable
                  style={styles.cancel}
                  onPress={() => cancelLeave.mutate(req.id)}
                >
                  <Text style={styles.cancelText}>Cancel request</Text>
                </Pressable>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  label: { color: colors.textMuted, fontWeight: '700' },
  range: { fontSize: 16, fontWeight: '800', color: colors.text, marginVertical: 8 },
  quick: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  section: { fontWeight: '800', fontSize: 16, marginTop: 22, marginBottom: 10, color: colors.text },
  row: { flexDirection: 'row', gap: 10 },
  name: { fontWeight: '800', color: colors.text },
  meta: { color: colors.textMuted, marginTop: 4 },
  cancel: { marginTop: 10 },
  cancelText: { color: colors.danger, fontWeight: '700' },
});
