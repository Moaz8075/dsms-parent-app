import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ChatThreadScreen } from '../screens/ChatScreens';
import { TeacherHomeScreen } from '../screens/teacher/TeacherHomeScreen';
import { TeacherClassesScreen } from '../screens/teacher/TeacherClassesScreen';
import { TeacherStudentsScreen } from '../screens/teacher/TeacherStudentsScreen';
import { TeacherStudentDetailScreen } from '../screens/teacher/TeacherStudentDetailScreen';
import { TeacherScheduleScreen } from '../screens/teacher/TeacherScheduleScreen';
import { TeacherDiaryScreen } from '../screens/teacher/TeacherDiaryScreen';
import { TeacherDiaryComposeScreen } from '../screens/teacher/TeacherDiaryComposeScreen';
import { TeacherAttendanceScreen } from '../screens/teacher/TeacherAttendanceScreen';
import { TeacherAttendanceSheetScreen } from '../screens/teacher/TeacherAttendanceSheetScreen';
import { TeacherTestsScreen } from '../screens/teacher/TeacherTestsScreen';
import { TeacherMarksheetScreen } from '../screens/teacher/TeacherMarksheetScreen';
import { TeacherEditTestScreen } from '../screens/teacher/TeacherEditTestScreen';
import { TeacherCreateTestScreen } from '../screens/teacher/TeacherCreateTestScreen';
import { TeacherAnnouncementsScreen } from '../screens/teacher/TeacherAnnouncementsScreen';
import { TeacherAnnouncementComposeScreen } from '../screens/teacher/TeacherAnnouncementComposeScreen';
import { TeacherChatListScreen } from '../screens/teacher/TeacherChatListScreen';
import { TeacherLeaveScreen } from '../screens/teacher/TeacherLeaveScreen';
import { CoursesScreen } from '../screens/CoursesScreen';
import { TeacherMyAttendanceScreen } from '../screens/teacher/TeacherMyAttendanceScreen';
import { ComplaintsScreen } from '../screens/ComplaintsScreen';
import { ComplaintDetailScreen } from '../screens/ComplaintDetailScreen';
import { TeacherMoreScreen } from '../screens/teacher/TeacherMoreScreen';
import { TeacherProfileScreen } from '../screens/teacher/TeacherProfileScreen';
import { useTabBarScreenOptions } from './tabBarOptions';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TeacherTabs() {
  const tabOptions = useTabBarScreenOptions();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabOptions,
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            TeacherHomeTab: focused ? 'home' : 'home-outline',
            TeacherClassesTab: focused ? 'school' : 'school-outline',
            TeacherAttendanceTab: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
            TeacherChatTab: focused ? 'chatbubbles' : 'chatbubbles-outline',
            TeacherMoreTab: focused ? 'menu' : 'menu-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="TeacherHomeTab" component={TeacherHomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="TeacherClassesTab" component={TeacherClassesScreen} options={{ title: 'Classes' }} />
      <Tab.Screen name="TeacherAttendanceTab" component={TeacherAttendanceScreen} options={{ title: 'Attendance' }} />
      <Tab.Screen name="TeacherChatTab" component={TeacherChatListScreen} options={{ title: 'Chat' }} />
      <Tab.Screen name="TeacherMoreTab" component={TeacherMoreScreen} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}

export function TeacherNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeacherTabs" component={TeacherTabs} />
      <Stack.Screen name="TeacherStudents" component={TeacherStudentsScreen} />
      <Stack.Screen name="TeacherStudentDetail" component={TeacherStudentDetailScreen} />
      <Stack.Screen name="TeacherSchedule" component={TeacherScheduleScreen} />
      <Stack.Screen name="TeacherDiary" component={TeacherDiaryScreen} />
      <Stack.Screen name="TeacherDiaryCompose" component={TeacherDiaryComposeScreen} />
      <Stack.Screen name="TeacherAttendanceSheet" component={TeacherAttendanceSheetScreen} />
      <Stack.Screen name="TeacherTests" component={TeacherTestsScreen} />
      <Stack.Screen name="TeacherMarksheet" component={TeacherMarksheetScreen} />
      <Stack.Screen name="TeacherCreateTest" component={TeacherCreateTestScreen} />
      <Stack.Screen name="TeacherEditTest" component={TeacherEditTestScreen} />
      <Stack.Screen name="TeacherAnnouncements" component={TeacherAnnouncementsScreen} />
      <Stack.Screen name="TeacherAnnouncementCompose" component={TeacherAnnouncementComposeScreen} />
      <Stack.Screen name="TeacherLeave" component={TeacherLeaveScreen} />
      <Stack.Screen name="Courses" component={CoursesScreen} />
      <Stack.Screen name="MyAttendance" component={TeacherMyAttendanceScreen} />
      <Stack.Screen name="Complaints" component={ComplaintsScreen} />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
      <Stack.Screen name="TeacherProfile" component={TeacherProfileScreen} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
    </Stack.Navigator>
  );
}
