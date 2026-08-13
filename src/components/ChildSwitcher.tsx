import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/format';
import { useState } from 'react';

export function ChildSwitcher({ compact = false }: { compact?: boolean }) {
  const { children, activeChild, setActiveChild } = useAuth();
  const [open, setOpen] = useState(false);
  if (!activeChild) return null;

  return (
    <>
      <Pressable onPress={() => children.length > 1 && setOpen(true)} style={styles.chip}>
        <View style={styles.avatar}>
          {activeChild.avatarUrl ? (
            <Image source={{ uri: activeChild.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{activeChild.initials || initials(activeChild.name)}</Text>
          )}
        </View>
        {!compact ? (
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {activeChild.name}
            </Text>
            <Text style={styles.grade} numberOfLines={1}>
              {activeChild.grade}
            </Text>
          </View>
        ) : null}
        {children.length > 1 ? <Ionicons name="chevron-down" size={16} color={colors.white} /> : null}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Switch child</Text>
            <ScrollView>
              {children.map((child) => {
                const selected = child.childId === activeChild.childId;
                return (
                  <Pressable
                    key={child.childId}
                    style={[styles.row, selected && styles.rowSelected]}
                    onPress={() => {
                      setActiveChild(child.childId);
                      setOpen(false);
                    }}
                  >
                    <View style={[styles.avatar, styles.avatarDark]}>
                      <Text style={styles.avatarTextDark}>{child.initials || initials(child.name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{child.name}</Text>
                      <Text style={styles.rowMeta}>
                        {child.grade} · {child.schoolName}
                      </Text>
                    </View>
                    {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 8,
    maxWidth: 220,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarDark: { backgroundColor: colors.primarySoft, width: 40, height: 40, borderRadius: 20 },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 11 },
  avatarTextDark: { color: colors.primary, fontWeight: '800' },
  name: { color: colors.white, fontWeight: '700', fontSize: 13 },
  grade: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowSelected: { backgroundColor: colors.primarySoft, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 12 },
  rowName: { fontWeight: '700', color: colors.text },
  rowMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
