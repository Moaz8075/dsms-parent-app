import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, type LoginRole } from '../context/AuthContext';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius } from '../theme';

const DEFAULT_SUBDOMAIN = process.env.EXPO_PUBLIC_SCHOOL_SUBDOMAIN || '';

export function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [role, setRole] = useState<LoginRole>('parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState(DEFAULT_SUBDOMAIN);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isTeacher = role === 'teacher';

  const onSubmit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (isTeacher && !subdomain.trim()) {
      setError('Enter your school code.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password, { role, subdomain: subdomain.trim() });
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image source={require('../../assets/dsms-mark.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>DSMS</Text>
          <Text style={styles.subtitle}>
            {isTeacher
              ? 'Mark attendance, share diary notes, and stay in touch with parents.'
              : 'Stay connected with attendance, diary, fees, and teachers.'}
          </Text>

          <View style={styles.roleSwitch}>
            <Pressable
              onPress={() => setRole('parent')}
              style={[styles.roleBtn, !isTeacher && styles.roleBtnActive]}
            >
              <Text style={[styles.roleText, !isTeacher && styles.roleTextActive]}>Parent</Text>
            </Pressable>
            <Pressable
              onPress={() => setRole('teacher')}
              style={[styles.roleBtn, isTeacher && styles.roleBtnActive]}
            >
              <Text style={[styles.roleText, isTeacher && styles.roleTextActive]}>Teacher</Text>
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {isTeacher ? (
            <>
              <Field
                label="School code"
                icon="business-outline"
                value={subdomain}
                onChangeText={setSubdomain}
                autoCapitalize="none"
                placeholder="your-school"
              />
              <Text style={styles.hint}>Use the same school subdomain as the web portal.</Text>
            </>
          ) : null}

          <Field
            label="Email Address"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            placeholder={isTeacher ? 'teacher@school.com' : 'parent@school.com'}
          />
          <Field
            label="Password"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter password"
          />

          <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <PrimaryButton title="Login" onPress={onSubmit} loading={loading} icon="arrow-forward" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function ForgotPasswordScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 28 }}>🔑</Text>
        </View>
        <Text style={styles.heading}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Password reset is managed by your school. Contact the school admin to restore access to your
          account.
        </Text>
        <PrimaryButton title="Back to Login" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  logo: { width: 88, height: 88, alignSelf: 'center', marginBottom: 12 },
  brand: { textAlign: 'center', fontSize: 28, fontWeight: '800', color: colors.primary },
  heading: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: 28,
    lineHeight: 22,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBtnActive: { backgroundColor: colors.primary },
  roleText: { fontWeight: '800', color: colors.textMuted },
  roleTextActive: { color: colors.white },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: -6, marginBottom: 14 },
  forgot: { alignSelf: 'flex-end', marginBottom: 18 },
  forgotText: { color: colors.primary, fontWeight: '700' },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: colors.danger, fontWeight: '600' },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
