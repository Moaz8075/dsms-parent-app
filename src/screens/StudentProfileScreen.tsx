import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Field } from '../components/Field';
import { KeyboardScreen } from '../components/KeyboardScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../api/auth';
import { colors, radius } from '../theme';
import { initials } from '../utils/format';

/** A student's own profile: who they are and where they study. Only the phone number is editable. */
export function StudentProfileScreen({ navigation }: any) {
  const { user, activeChild, school, updateUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone ?? '');
  const mutation = useMutation({ mutationFn: updateUserProfile });
  const university = activeChild?.track === 'UNIVERSITY';
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  const save = async () => {
    try {
      const updated = await mutation.mutateAsync({ phone: phone.trim() });
      updateUser({ phone: updated?.phone ?? phone.trim() });
      Alert.alert('Saved', 'Your phone number was updated.');
    } catch (err: any) {
      Alert.alert('Update failed', err?.message || 'Try again.');
    }
  };

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | null }[] = [
    { icon: 'business-outline', label: 'School', value: activeChild?.schoolName ?? school?.name },
    university
      ? { icon: 'school-outline', label: 'Program', value: activeChild?.programName }
      : { icon: 'school-outline', label: 'Class', value: activeChild?.className ?? activeChild?.grade },
    university
      ? { icon: 'layers-outline', label: 'Semester', value: activeChild?.semester ? `Semester ${activeChild.semester}` : null }
      : { icon: 'layers-outline', label: 'Grade', value: activeChild?.grade },
  ];

  return (
    <View style={styles.root}>
      <KeyboardScreen
        header={<ScreenHeader title="My Profile" onBack={() => navigation.goBack()} />}
        contentContainerStyle={styles.body}
      >
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(fullName)}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
            <Badge label="Student" tone="primary" />
            <Badge label={university ? 'University' : 'School'} tone={university ? 'info' : 'success'} />
          </View>
        </View>

        <Card>
          <Text style={styles.section}>Academic details</Text>
          {rows.filter((r) => r.value).map((r, i, list) => (
            <View key={r.label} style={[styles.row, i < list.length - 1 && styles.divider]}>
              <View style={styles.rowIcon}>
                <Ionicons name={r.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={styles.rowValue}>{r.value}</Text>
              </View>
            </View>
          ))}
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={styles.section}>Contact</Text>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={styles.locked}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <Text style={styles.lockedValue} selectable>{user?.email || '—'}</Text>
          </View>
          <Text style={styles.helper}>Your name and email are managed by the school. Ask the office to change them.</Text>
          <Field
            label="Phone"
            icon="call-outline"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Add a phone number"
          />
          <PrimaryButton title="Save changes" loading={mutation.isPending} onPress={save} />
        </Card>
      </KeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 32, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 12, textAlign: 'center' },
  section: { fontWeight: '800', color: colors.text, marginBottom: 10, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  rowValue: { color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 2 },
  fieldLabel: { color: colors.text, fontWeight: '600', marginBottom: 8, fontSize: 14 },
  locked: {
    minHeight: 52, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  lockedValue: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  helper: { color: colors.textMuted, fontSize: 12, marginTop: 8, marginBottom: 14, lineHeight: 18 },
});
