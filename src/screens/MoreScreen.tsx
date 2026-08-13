import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useParentFees } from '../hooks/useParentQueries';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { Card } from '../components/Card';
import { MenuRow } from '../components/MenuRow';
import { colors } from '../theme';

export function MoreScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { activeChild, logout } = useAuth();
  const fees = useParentFees(activeChild?.childId);
  const due = fees.data?.summary?.totalDue ?? 0;

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>More</Text>
          <ChildSwitcher compact />
        </View>
        <Text style={styles.sub}>
          {activeChild ? `${activeChild.name} · ${activeChild.grade}` : 'School services'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Card>
          <Text style={styles.section}>School services</Text>
          <MenuRow
            icon="card-outline"
            color={colors.primary}
            title="Fees & Payments"
            subtitle={due > 0 ? 'Outstanding balance' : 'All caught up'}
            badge={due > 0 ? 'Due' : undefined}
            onPress={() => navigation.navigate('Fees')}
          />
          <MenuRow
            icon="calendar-outline"
            color={colors.warning}
            title="Leave Requests"
            onPress={() => navigation.navigate('Leave')}
          />
          <MenuRow
            icon="megaphone-outline"
            color={colors.danger}
            title="Announcements"
            onPress={() => navigation.navigate('Announcements')}
          />
          <MenuRow
            icon="create-outline"
            color="#0EA5A4"
            title="Class Tests"
            onPress={() => navigation.navigate('Tests')}
          />
          <MenuRow
            icon="school-outline"
            color="#7C3AED"
            title="Exams"
            onPress={() => navigation.navigate('Exams')}
          />
          <MenuRow
            icon="document-text-outline"
            color={colors.success}
            title="Report Card"
            onPress={() => navigation.navigate('ReportCard')}
          />
          <MenuRow
            icon="checkmark-circle-outline"
            color={colors.info}
            title="Attendance"
            onPress={() => navigation.navigate('Attendance')}
          />
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={styles.section}>Account</Text>
          <MenuRow
            icon="person-outline"
            color={colors.primary}
            title="Profile"
            onPress={() => navigation.navigate('Profile')}
          />
        </Card>

        <Pressable onPress={confirmLogout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.white, fontSize: 24, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  body: { padding: 16, paddingBottom: 40 },
  section: { fontWeight: '800', color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', fontSize: 12 },
  logout: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  logoutText: { color: colors.danger, fontWeight: '800', fontSize: 16 },
});
