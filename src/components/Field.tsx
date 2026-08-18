import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

type Props = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
};

export function Field({ label, icon, error, multiline, style, ...props }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, multiline && styles.inputMultiline, error && styles.inputError]}>
        {icon && !multiline ? <Ionicons name={icon} size={18} color={colors.textMuted} /> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, multiline && styles.multilineInput, style]}
          autoCapitalize="none"
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14, alignSelf: 'stretch', width: '100%' },
  label: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputMultiline: { alignItems: 'flex-start', minHeight: 110, paddingVertical: 8 },
  inputError: { borderColor: colors.danger },
  input: { flex: 1, minWidth: 0, color: colors.text, fontSize: 16, paddingVertical: 12 },
  multilineInput: { minHeight: 90, paddingVertical: 8 },
  error: { color: colors.danger, marginTop: 6, fontSize: 12 },
});
