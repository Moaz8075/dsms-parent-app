import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { LoginScreen, ForgotPasswordScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DiaryScreen } from '../screens/DiaryScreen';
import { DiaryDetailScreen } from '../screens/DiaryDetailScreen';
import { AcademicsScreen } from '../screens/AcademicsScreen';
import { ChatListScreen, ChatThreadScreen } from '../screens/ChatScreens';
import { MoreScreen } from '../screens/MoreScreen';
import { FeesScreen } from '../screens/FeesScreen';
import { LeaveScreen } from '../screens/LeaveScreen';
import { AnnouncementsScreen } from '../screens/AnnouncementsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AttendanceScreen } from '../screens/AttendanceScreen';
import { ReportCardScreen } from '../screens/ReportCardScreen';
import { TestsScreen, ExamsScreen } from '../screens/AssessmentListScreen';
import { ExamDetailScreen } from '../screens/ExamDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.primary,
    card: colors.white,
    text: colors.text,
    border: colors.border,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            HomeTab: 'home-outline',
            DiaryTab: 'book-outline',
            AcademicsTab: 'school-outline',
            ChatTab: 'chatbubbles-outline',
            MoreTab: 'menu-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="DiaryTab" component={DiaryScreen} options={{ title: 'Diary' }} />
      <Tab.Screen name="AcademicsTab" component={AcademicsScreen} options={{ title: 'Academics' }} />
      <Tab.Screen name="ChatTab" component={ChatListScreen} options={{ title: 'Chat' }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { ready, isAuthenticated, needsOnboarding } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : needsOnboarding ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="Fees" component={FeesScreen} />
            <Stack.Screen name="Leave" component={LeaveScreen} />
            <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} />
            <Stack.Screen name="ReportCard" component={ReportCardScreen} />
            <Stack.Screen name="Tests" component={TestsScreen} />
            <Stack.Screen name="Exams" component={ExamsScreen} />
            <Stack.Screen name="ExamDetail" component={ExamDetailScreen} />
            <Stack.Screen name="DiaryDetail" component={DiaryDetailScreen} />
            <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
