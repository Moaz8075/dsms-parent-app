import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState, LoadingState } from '../../components/States';
import { useTeacherClasses } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';
import { formatDate, isoDate } from '../../utils/format';

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function otpKey(classId: string, date: string) {
  return `dsms_teacher_otp_${classId}_${date}`;
}

export function TeacherOtpScreen({ navigation }: any) {
  const { data, isLoading } = useTeacherClasses();
  const classes = useMemo(
    () => Array.from(new Map((data?.classes ?? []).map((item) => [item.classId, item])).values()),
    [data],
  );
  const [classId, setClassId] = useState('');
  const [otp, setOtp] = useState('');
  const today = isoDate();

  useEffect(() => {
    if (!classId && classes[0]?.classId) setClassId(classes[0].classId);
  }, [classId, classes]);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    AsyncStorage.getItem(otpKey(classId, today)).then((stored) => {
      if (cancelled) return;
      if (stored) {
        setOtp(stored);
        return;
      }
      const next = makeOtp();
      setOtp(next);
      void AsyncStorage.setItem(otpKey(classId, today), next);
    });
    return () => {
      cancelled = true;
    };
  }, [classId, today]);

  const selected = classes.find((item) => item.classId === classId);
  const studentCount = selected?.students ?? data?.classes?.reduce((sum, item) => sum + (item.students || 0), 0) ?? 0;

  const regenerate = async () => {
    const next = makeOtp();
    setOtp(next);
    if (classId) await AsyncStorage.setItem(otpKey(classId, today), next);
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Class OTP" subtitle="Share today’s code" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        {isLoading ? <LoadingState /> : null}
        {!isLoading && classes.length === 0 ? (
          <EmptyState title="No classes assigned" subtitle="Ask admin to assign a class first." icon="keypad-outline" />
        ) : (
          <>
            <Text style={styles.label}>Class</Text>
            <View style={styles.wrapPills}>
              {classes.map((item) => (
                <Pressable
                  key={item.classId}
                  onPress={() => setClassId(item.classId)}
                  style={[styles.pill, classId === item.classId && styles.pillActive]}
                >
                  <Text style={[styles.pillText, classId === item.classId && styles.pillTextActive]}>
                    {item.grade}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Card style={styles.otpCard}>
              <Text style={styles.date}>{formatDate(today)}</Text>
              <Text style={styles.className}>{selected?.grade || 'Select a class'}</Text>
              <Text style={styles.otp}>{otp || '------'}</Text>
              <Text style={styles.hint}>
                {studentCount} students · Show this code in class. It stays the same until you generate a new one.
              </Text>
              <PrimaryButton title="Generate new OTP" onPress={regenerate} icon="refresh" variant="outline" />
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  label: { color: colors.text, fontWeight: '600', marginBottom: 8, fontSize: 14 },
  wrapPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontWeight: '700', color: colors.text },
  pillTextActive: { color: colors.white },
  otpCard: { alignItems: 'center', paddingVertical: 28 },
  date: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  className: { color: colors.text, fontWeight: '800', fontSize: 18, marginTop: 8 },
  otp: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 8,
    color: colors.primary,
    marginVertical: 18,
  },
  hint: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
});
