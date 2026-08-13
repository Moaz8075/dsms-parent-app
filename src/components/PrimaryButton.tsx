import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

type Props = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
};

export function PrimaryButton({
  title,
  onPress,
  loading,
  variant = 'primary',
  icon,
  disabled,
}: Props) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.primary,
        variant === 'outline' && styles.outline,
        isDanger && styles.danger,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary || isDanger ? colors.white : colors.primary} />
      ) : (
        <View style={styles.row}>
          <Text
            style={[
              styles.label,
              !isPrimary && !isDanger && styles.outlineLabel,
              isDanger && styles.dangerLabel,
            ]}
          >
            {title}
          </Text>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={isPrimary || isDanger ? colors.white : colors.primary}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primary: { backgroundColor: colors.primary },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.88 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: colors.white, fontSize: 16, fontWeight: '700' },
  outlineLabel: { color: colors.primary },
  dangerLabel: { color: colors.white },
});
