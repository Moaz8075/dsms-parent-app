import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, radius } from '../theme';
import { parseIsoDate, isoDate } from '../utils/format';

type Props = {
  visible: boolean;
  value: string; // YYYY-MM-DD
  title?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  onClose: () => void;
  onPick: (iso: string) => void;
};

/** A calendar popup you open from any date label (arrows stay on the screen). Android: system dialog; iOS: bottom sheet. */
export function DatePickerSheet({ visible, value, title = 'Choose a date', maximumDate, minimumDate, onClose, onPick }: Props) {
  const selected = parseIsoDate(value);

  const onChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') onClose();
    if (event.type === 'dismissed') return;
    if (date) onPick(isoDate(date));
  };

  if (!visible) return null;

  if (Platform.OS === 'android') {
    return <DateTimePicker value={selected} mode="date" display="calendar" maximumDate={maximumDate} minimumDate={minimumDate} onChange={onChange} />;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>
        <DateTimePicker value={selected} mode="date" display="inline" themeVariant="light" maximumDate={maximumDate} minimumDate={minimumDate} onChange={onChange} style={styles.picker} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontWeight: '700', fontSize: 16, color: colors.text },
  done: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  picker: { alignSelf: 'center' },
});
