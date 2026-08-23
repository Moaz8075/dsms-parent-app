import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge, statusTone } from '../components/Badge';
import { DateField } from '../components/DateField';
import { Field } from '../components/Field';
import { KeyboardScreen } from '../components/KeyboardScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import {
  useCancelLeaveRequest,
  useCreateLeaveRequest,
  useParentLeaveRequests,
} from '../hooks/useParentQueries';
import { colors, radius } from '../theme';
import { toUserMessage } from '../utils/errors';
import {
  addDays,
  datesOverlap,
  daysBetween,
  formatDate,
  isoDate,
  nextSchoolWeekRange,
  parseIsoDate,
} from '../utils/format';

const ACTIVE_LEAVE_STATUSES = new Set(['PENDING', 'APPROVED']);

export function LeaveScreen({ navigation }: any) {
  const { activeChildId, activeChild } = useAuth();
  const { data, isLoading, isError, error, refetch } = useParentLeaveRequests();
  const createLeave = useCreateLeaveRequest();
  const cancelLeave = useCancelLeaveRequest();
  const [startDate, setStartDate] = useState(isoDate());
  const [endDate, setEndDate] = useState(addDays(isoDate(), 1));
  const [reason, setReason] = useState('');

  const today = useMemo(() => parseIsoDate(isoDate()), []);
  const days = useMemo(() => Math.max(1, daysBetween(startDate, endDate)), [startDate, endDate]);

  const setStart = (next: string) => {
    setStartDate(next);
    if (next > endDate) setEndDate(next);
  };

  const setEnd = (next: string) => {
    setEndDate(next);
    if (next < startDate) setStartDate(next);
  };

  const overlappingLeave = useMemo(() => {
    if (!activeChildId) return null;
    return (
      (data?.requests ?? []).find(
        (req) =>
          req.childId === activeChildId &&
          ACTIVE_LEAVE_STATUSES.has(String(req.status).toUpperCase()) &&
          datesOverlap(startDate, endDate, req.startDate, req.endDate),
      ) ?? null
    );
  }, [activeChildId, data?.requests, startDate, endDate]);

  const submit = async () => {
    if (!activeChildId) return;

    if (!startDate || !endDate) {
      Alert.alert('Choose dates', 'Please select a start and end date for the leave.');
      return;
    }
    if (endDate < startDate) {
      Alert.alert('Invalid dates', 'End date must be on or after the start date.');
      return;
    }
    if (reason.trim().length < 3) {
      Alert.alert('Reason required', 'Please explain why leave is needed.');
      return;
    }
    if (overlappingLeave) {
      Alert.alert(
        'Leave already requested',
        `You already have a ${overlappingLeave.status.toLowerCase()} leave for ${formatDate(overlappingLeave.startDate)} – ${formatDate(overlappingLeave.endDate)}. Choose different dates or cancel that request first.`,
      );
      return;
    }

    try {
      await createLeave.mutateAsync({
        childId: activeChildId,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      setReason('');
      Alert.alert('Submitted', 'Your leave request was sent to the class teacher.');
    } catch (err: unknown) {
      Alert.alert(
        'Could not submit',
        toUserMessage(err, 'Something went wrong while submitting leave. Please try again.'),
      );
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardScreen
        header={
          <ScreenHeader
            title="Leave Requests"
            subtitle={activeChild ? `${activeChild.name} · ${activeChild.grade}` : undefined}
            onBack={() => navigation.goBack()}
          />
        }
        contentContainerStyle={styles.body}
      >
        <Card>
          <Text style={styles.label}>Selected range</Text>
          <Text style={styles.range}>
            {formatDate(startDate)} – {formatDate(endDate)} · {days} day{days > 1 ? 's' : ''}
          </Text>
          {overlappingLeave ? (
            <Text style={styles.overlapHint}>
              Overlaps an existing {overlappingLeave.status.toLowerCase()} request.
            </Text>
          ) : null}
          <View style={styles.quick}>
            <Chip
              label="Tomorrow"
              onPress={() => {
                const d = addDays(isoDate(), 1);
                setStartDate(d);
                setEndDate(d);
              }}
            />
            <Chip
              label="3 days"
              onPress={() => {
                setStartDate(isoDate());
                setEndDate(addDays(isoDate(), 2));
              }}
            />
            <Chip
              label="Next week"
              onPress={() => {
                const range = nextSchoolWeekRange();
                setStartDate(range.startDate);
                setEndDate(range.endDate);
              }}
            />
          </View>
          <DateField label="Start date" value={startDate} onChange={setStart} minimumDate={today} />
          <DateField
            label="End date"
            value={endDate}
            onChange={setEnd}
            minimumDate={parseIsoDate(startDate)}
          />
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
        {isError ? (
          <ErrorState
            message={toUserMessage(error, 'Could not load leave requests. Please try again.')}
            onRetry={() => refetch()}
          />
        ) : null}
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
                <Pressable style={styles.cancel} onPress={() => cancelLeave.mutate(req.id)}>
                  <Text style={styles.cancelText}>Cancel request</Text>
                </Pressable>
              ) : null}
            </Card>
          ))
        )}
      </KeyboardScreen>
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
  overlapHint: { color: colors.danger, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  quick: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
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
