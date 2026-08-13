import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useUpdateParentProfile } from '../hooks/useParentQueries';
import { colors, radius } from '../theme';
import { initials } from '../utils/format';

export function ProfileScreen({ navigation }: any) {
  const { user, children, updateUser } = useAuth();
  const mutation = useUpdateParentProfile();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  const save = async () => {
    try {
      const updated = await mutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      updateUser(updated);
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (err: any) {
      Alert.alert('Update failed', err?.message || 'Try again.');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="My Profile" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(`${firstName} ${lastName}`)}</Text>
            </View>
            <Text style={styles.name}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.role}>Parent</Text>
          </View>

          <Card>
            <Text style={styles.section}>Contact details</Text>
            <Field
              label="First name"
              icon="person-outline"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              placeholder="First name"
            />
            <Field
              label="Last name"
              icon="person-outline"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              placeholder="Last name"
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.lockedField}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
              <Text style={styles.lockedValue} selectable>
                {user?.email || '—'}
              </Text>
            </View>
            <Text style={styles.helper}>Email is managed by the school and can’t be changed here.</Text>

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

          <Card style={{ marginTop: 16 }}>
            <Text style={styles.section}>Linked students</Text>
            {children.length === 0 ? (
              <Text style={styles.helper}>No students are linked to this account yet.</Text>
            ) : (
              children.map((child, index) => (
                <View
                  key={child.childId}
                  style={[styles.childRow, index < children.length - 1 && styles.childDivider]}
                >
                  <View style={styles.childAvatar}>
                    <Text style={styles.childInitials}>{child.initials || initials(child.name)}</Text>
                  </View>
                  <View style={styles.childMeta}>
                    <Text style={styles.childName} numberOfLines={1}>
                      {child.name}
                    </Text>
                    <Text style={styles.childSub} numberOfLines={2}>
                      {child.grade} · {child.schoolName}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 20 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 32, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 12, textAlign: 'center' },
  role: { color: colors.textMuted, marginTop: 4 },
  section: { fontWeight: '800', color: colors.text, marginBottom: 14, fontSize: 16 },
  fieldLabel: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  lockedField: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockedValue: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  helper: { color: colors.textMuted, fontSize: 12, marginTop: 8, marginBottom: 14, lineHeight: 18 },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  childDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childInitials: { color: colors.primary, fontWeight: '800' },
  childMeta: { flex: 1 },
  childName: { fontWeight: '800', color: colors.text, fontSize: 16 },
  childSub: { color: colors.textMuted, marginTop: 3, fontSize: 13 },
});
