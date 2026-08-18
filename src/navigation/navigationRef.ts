import { createNavigationContainerRef } from '@react-navigation/native';
import type { PushPayload } from '../notifications/push';

export const navigationRef = createNavigationContainerRef();

export function navigateFromPush(payload: PushPayload, isTeacher: boolean) {
  if (!navigationRef.isReady()) return;

  const schoolId = payload.schoolId;
  const name =
    payload.conversationId && payload.type === 'CHAT' ? 'Chat' : payload.conversationId ? 'Chat' : undefined;

  if (payload.conversationId) {
    if (isTeacher) {
      navigationRef.navigate(
        'Teacher' as never,
        {
          screen: 'ChatThread',
          params: { conversationId: payload.conversationId, schoolId, name: name || 'Chat' },
        } as never,
      );
    } else {
      navigationRef.navigate(
        'ChatThread' as never,
        { conversationId: payload.conversationId, schoolId, name: name || 'Chat' } as never,
      );
    }
    return;
  }

  const type = (payload.type || '').toUpperCase();

  if (isTeacher) {
    if (type === 'ANNOUNCEMENT') {
      navigationRef.navigate('Teacher' as never, { screen: 'TeacherAnnouncements' } as never);
      return;
    }
    if (type === 'ATTENDANCE_ALERT' || type === 'ATTENDANCE') {
      navigationRef.navigate('Teacher' as never, { screen: 'TeacherTabs', params: { screen: 'TeacherAttendanceTab' } } as never);
      return;
    }
    if (type === 'MARKS_PUBLISHED') {
      navigationRef.navigate('Teacher' as never, { screen: 'TeacherTests' } as never);
      return;
    }
    navigationRef.navigate('Teacher' as never, { screen: 'TeacherTabs', params: { screen: 'TeacherHomeTab' } } as never);
    return;
  }

  if (type === 'ANNOUNCEMENT') {
    navigationRef.navigate('Announcements' as never);
    return;
  }
  if (type === 'LEAVE_SUBMITTED' || type === 'LEAVE_REVIEWED') {
    navigationRef.navigate('Leave' as never);
    return;
  }
  if (type === 'PAYMENT_RECEIPT') {
    navigationRef.navigate('Fees' as never);
    return;
  }
  if (type === 'ATTENDANCE_ALERT' || type === 'ATTENDANCE') {
    navigationRef.navigate('Attendance' as never);
    return;
  }
  if (type === 'MARKS_PUBLISHED') {
    navigationRef.navigate('Tests' as never);
  }
}
