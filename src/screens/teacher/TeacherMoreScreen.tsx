import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/Card';
import { MenuRow } from '../../components/MenuRow';
import { colors } from '../../theme';

export function TeacherMoreScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, school, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.sub}>
          {user?.firstName} {user?.lastName}
          {school?.name ? ` · ${school.name}` : ''}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Card>
          <Text style={styles.section}>Classroom</Text>
          <MenuRow
            icon="keypad-outline"
            color="#0F766E"
            title="Class OTP"
            subtitle="Today’s code for students"
            onPress={() => navigation.navigate('TeacherOtp')}
          />
          <MenuRow
            icon="calendar-outline"
            color={colors.warning}
            title="My Schedule"
            subtitle="Weekly timetable"
            onPress={() => navigation.navigate('TeacherSchedule')}
          />
          <MenuRow
            icon="people-outline"
            color="#7C3AED"
            title="Students"
            onPress={() => navigation.navigate('TeacherStudents')}
          />
          <MenuRow
            icon="book-outline"
            color="#5C6BC0"
            title="Class Diary"
            subtitle="Write notes for parents"
            onPress={() => navigation.navigate('TeacherDiary')}
          />
          <MenuRow
            icon="create-outline"
            color="#0EA5A4"
            title="Tests & Marks"
            onPress={() => navigation.navigate('TeacherTests')}
          />
          <MenuRow
            icon="megaphone-outline"
            color={colors.danger}
            title="Announcements"
            onPress={() => navigation.navigate('TeacherAnnouncements')}
          />
        </Card>
        <Card style={{ marginTop: 16 }}>
          <Text style={styles.section}>Account</Text>
          <MenuRow
            icon="person-outline"
            color={colors.primary}
            title="Profile"
            onPress={() => navigation.navigate('TeacherProfile')}
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
