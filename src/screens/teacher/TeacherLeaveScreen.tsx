import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Badge, statusTone } from '../../components/Badge';
import { Field } from '../../components/Field';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { useReviewLeaveRequest, useStaffLeaveRequests } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';
import { toUserMessage } from '../../utils/errors';
import { daysBetween, formatDate } from '../../utils/format';
import type { TeacherLeaveRequest } from '../../types';

const TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

export function TeacherLeaveScreen({ navigation }: any) {
  const [tab, setTab] = useState('PENDING');
  const [reviewTarget, setReviewTarget] = useState<TeacherLeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const { data, isLoading, isError, error, refetch } = useStaffLeaveRequests(tab);
  const reviewLeave = useReviewLeaveRequest();
  const requests = data?.requests ?? [];

  const openReview = (request: TeacherLeaveRequest, action: 'APPROVED' | 'REJECTED') => {
    setReviewTarget(request);
    setReviewAction(action);
    setReviewNote('');
  };

  const closeReview = () => {
    setReviewTarget(null);
    setReviewAction(null);
    setReviewNote('');
  };

  const submitReview = async () => {
    if (!reviewTarget || !reviewAction) return;
    try {
      await reviewLeave.mutateAsync({
        id: reviewTarget.id,
        status: reviewAction,
        reviewNote: reviewNote.trim() || undefined,
      });
      closeReview();
      Alert.alert(
        reviewAction === 'APPROVED' ? 'Leave approved' : 'Leave rejected',
        reviewAction === 'APPROVED'
          ? 'Attendance will be marked as excused for the approved dates.'
          : 'The parent has been notified.',
      );
    } catch (err: unknown) {
      Alert.alert(
        'Could not update',
        toUserMessage(err, 'Something went wrong. Please try again.'),
      );
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Leave Requests"
        subtitle="Review requests from parents"
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.filters}>
          {TABS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[styles.pill, tab === item.key && styles.pillActive]}
            >
              <Text style={[styles.pillText, tab === item.key && styles.pillTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? <LoadingState /> : null}
        {isError ? (
          <ErrorState
            message={toUserMessage(error, 'Could not load leave requests. Please try again.')}
            onRetry={() => refetch()}
          />
        ) : null}

        {!isLoading && requests.length === 0 ? (
          <EmptyState
            title={tab === 'PENDING' ? 'No pending requests' : 'No leave requests'}
            subtitle="Parents can submit leave from the mobile app."
            icon="calendar-outline"
          />
        ) : (
          requests.map((req) => {
            const days = Math.max(1, daysBetween(req.startDate, req.endDate));
            return (
              <Card key={req.id} style={{ marginBottom: 12 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.student}>{req.studentName}</Text>
                  <Badge label={req.status} tone={statusTone(req.status)} />
                </View>
                <Text style={styles.meta}>{req.className}</Text>
                <Text style={styles.meta}>
                  {formatDate(req.startDate)} – {formatDate(req.endDate)} · {days} day{days > 1 ? 's' : ''}
                </Text>
                <Text style={styles.meta}>Parent: {req.parentName}</Text>
                <Text style={styles.reason}>{req.reason}</Text>
                {req.reviewNote ? <Text style={styles.note}>Note: {req.reviewNote}</Text> : null}
                {req.status === 'PENDING' ? (
                  <View style={styles.actions}>
                    <Pressable style={styles.approveBtn} onPress={() => openReview(req, 'APPROVED')}>
                      <Ionicons name="checkmark" size={18} color={colors.white} />
                      <Text style={styles.approveText}>Approve</Text>
                    </Pressable>
                    <Pressable style={styles.rejectBtn} onPress={() => openReview(req, 'REJECTED')}>
                      <Ionicons name="close" size={18} color={colors.danger} />
                      <Text style={styles.rejectText}>Reject</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>

      <Modal visible={Boolean(reviewTarget)} transparent animationType="fade" onRequestClose={closeReview}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {reviewAction === 'APPROVED' ? 'Approve leave' : 'Reject leave'}
            </Text>
            {reviewTarget ? (
              <Text style={styles.modalSub}>
                {reviewTarget.studentName} · {formatDate(reviewTarget.startDate)} –{' '}
                {formatDate(reviewTarget.endDate)}
              </Text>
            ) : null}
            <Field
              label="Note for parent (optional)"
              value={reviewNote}
              onChangeText={setReviewNote}
              placeholder="Add a short note…"
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable onPress={closeReview} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <PrimaryButton
                title={reviewAction === 'APPROVED' ? 'Approve' : 'Reject'}
                loading={reviewLeave.isPending}
                onPress={submitReview}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  pillTextActive: { color: colors.white },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  student: { fontWeight: '800', fontSize: 16, color: colors.text, flex: 1 },
  meta: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  reason: { color: colors.text, marginTop: 10, lineHeight: 20 },
  note: { color: colors.textMuted, marginTop: 8, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  approveText: { color: colors.white, fontWeight: '800' },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  rejectText: { color: colors.danger, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 20,
  },
  modalTitle: { fontWeight: '800', fontSize: 18, color: colors.text },
  modalSub: { color: colors.textMuted, marginTop: 6, marginBottom: 8 },
  modalActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 8 },
  modalCancelText: { color: colors.textMuted, fontWeight: '700' },
});
