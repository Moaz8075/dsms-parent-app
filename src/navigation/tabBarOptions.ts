import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '../theme';

const TAB_CONTENT_HEIGHT = 58;

/** Shared bottom-tab look: clear bar that clears Android/iOS system nav. */
export function useTabBarScreenOptions() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  return {
    headerShown: false as const,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarHideOnKeyboard: true,
    tabBarStyle: {
      backgroundColor: colors.white,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      height: TAB_CONTENT_HEIGHT + bottomPad,
      paddingTop: 8,
      paddingBottom: bottomPad,
      ...shadow.card,
      elevation: 12,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 },
    },
    tabBarItemStyle: {
      paddingVertical: 2,
    },
    tabBarLabelStyle: {
      fontWeight: '800' as const,
      fontSize: 11,
      marginTop: 2,
    },
    tabBarIconStyle: {
      marginTop: 2,
    },
  };
}
