import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

const TONE: Record<string, { bg: string; fg: string }> = {
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.infoSoft, fg: colors.info },
  primary: { bg: colors.primarySoft, fg: colors.primary },
  muted: { bg: colors.background, fg: colors.textMuted },
};

export function Badge({
  label,
  tone = 'primary',
}: {
  label: string;
  tone?: keyof typeof TONE;
}) {
  const palette = TONE[tone] ?? TONE.primary;
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export function statusTone(status?: string) {
  const value = (status || '').toUpperCase();
  if (['PAID', 'APPROVED', 'PRESENT', 'COMPLETED', 'SUBMITTED', 'PUBLISHED', 'ACTIVE', 'ON TIME'].includes(value)) return 'success' as const;
  if (['PENDING', 'PARTIAL', 'LATE', 'PROCESSING', 'UNPAID', 'DRAFT', 'IN_PROGRESS', 'GRADING', 'EXCUSED', 'HALF_DAY'].includes(value)) return 'warning' as const;
  if (['OVERDUE', 'REJECTED', 'ABSENT', 'FAILED', 'CANCELLED', 'AT RISK', 'URGENT'].includes(value)) return 'danger' as const;
  return 'info' as const;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
});
