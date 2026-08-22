import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors } from '../theme';
import { usePushStatus } from '../notifications/push';

const STATE_LABEL: Record<string, string> = {
  idle: 'Not registered yet',
  registering: 'Registering…',
  registered: 'Token saved',
  skipped: 'Not available',
  failed: 'Registration failed',
};

const NOTIFY_LABEL: Record<string, string> = {
  idle: 'Not tested',
  ok: 'Chat notify succeeded',
  failed: 'Chat notify failed',
};

export function PushStatusCard() {
  const status = usePushStatus();
  const ok = status.state === 'registered';
  const bad = status.state === 'failed' || status.lastNotify === 'failed';

  return (
    <Card style={{ marginTop: 16 }}>
      <Text style={styles.section}>Push debug</Text>
      <Text style={[styles.badge, ok && styles.ok, bad && styles.bad]}>
        {STATE_LABEL[status.state]}
      </Text>
      <Text style={styles.line}>{status.detail}</Text>
      {status.tokenTail ? <Text style={styles.mono}>Token {status.tokenTail}</Text> : null}
      <Text style={styles.mono}>{status.apiBase}</Text>
      <View style={styles.divider} />
      <Text style={[styles.badge, status.lastNotify === 'ok' && styles.ok, status.lastNotify === 'failed' && styles.bad]}>
        {NOTIFY_LABEL[status.lastNotify]}
      </Text>
      <Text style={styles.line}>{status.lastNotifyDetail}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  badge: { fontWeight: '800', color: colors.text, marginBottom: 6 },
  ok: { color: colors.success },
  bad: { color: colors.danger },
  line: { color: colors.text, lineHeight: 20 },
  mono: { color: colors.textMuted, marginTop: 6, fontSize: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 12 },
});
