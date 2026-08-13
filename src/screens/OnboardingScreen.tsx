import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCompleteOnboarding, useParentOnboarding } from '../hooks/useParentQueries';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingState } from '../components/States';
import { colors, radius } from '../theme';

export function OnboardingScreen({ navigation }: any) {
  const { user, children, updateUser } = useAuth();
  const { data, isLoading } = useParentOnboarding();
  const complete = useCompleteOnboarding();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  const steps = [
    {
      title: 'Complete your profile',
      subtitle: 'Add your phone number so the school can reach you.',
      done: Boolean(data?.steps?.profileComplete),
      action: () => navigation.navigate('Profile'),
    },
    {
      title: 'Children linked',
      subtitle: children.length
        ? `${children.length} child${children.length > 1 ? 'ren' : ''} connected.`
        : 'Your children will appear here once the school links them.',
      done: Boolean(data?.steps?.childrenLinked),
    },
  ];

  const finish = async () => {
    const result = await complete.mutateAsync();
    updateUser({ onboardingCompletedAt: result.onboardingCompletedAt });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome, {user?.firstName}</Text>
        <Text style={styles.subtitle}>
          Finalize your account setup to start tracking student progress.
        </Text>

        {steps.map((step) => (
          <View key={step.title} style={styles.card}>
            <View style={[styles.icon, step.done && styles.iconDone]}>
              <Ionicons
                name={step.done ? 'checkmark' : 'ellipse-outline'}
                size={20}
                color={step.done ? colors.white : colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepSub}>{step.subtitle}</Text>
            </View>
          </View>
        ))}

        <PrimaryButton
          title="Complete setup"
          loading={complete.isPending}
          onPress={finish}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: 8, marginBottom: 28, lineHeight: 22 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDone: { backgroundColor: colors.success },
  stepTitle: { fontWeight: '800', color: colors.text, fontSize: 16 },
  stepSub: { color: colors.textMuted, marginTop: 4 },
});
