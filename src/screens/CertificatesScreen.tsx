import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useCertificates } from '../hooks/useFamily';
import { openFamilyDocument } from '../api/family';
import { colors } from '../theme';

/** Certificates and awards issued to the student (view / print opens the school's certificate page). */
export function CertificatesScreen({ navigation }: any) {
  const { activeChildId, activeChild } = useAuth();
  const { data, isLoading, isError, error, refetch } = useCertificates(activeChildId);

  const open = (id: string) =>
    openFamilyDocument(activeChildId as string, 'certificate', id).catch((e) => Alert.alert('Could not open', e.message));

  return (
    <View style={styles.root}>
      <ScreenHeader title="Certificates" subtitle={activeChild?.name} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {!isLoading && !isError && (data ?? []).length === 0 ? (
          <EmptyState title="No certificates yet" subtitle="Certificates and awards issued by the school appear here." />
        ) : null}
        {(data ?? []).map((c) => (
          <Pressable key={c.id} onPress={() => open(c.id)}>
            <Card style={{ marginBottom: 12 }}>
              <View style={styles.row}>
                <View style={styles.icon}><Ionicons name="ribbon-outline" size={22} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{c.title}</Text>
                  <Text style={styles.meta}>{c.certificateNumber} · {c.issuedOnLabel}</Text>
                </View>
                <Badge label={c.status === 'ISSUED' ? 'Valid' : 'Revoked'} tone={c.status === 'ISSUED' ? 'success' : 'danger'} />
              </View>
              <Text style={styles.hint}>Tap to view, print or save as PDF</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '800', color: colors.text, fontSize: 15 },
  meta: { color: colors.textMuted, marginTop: 3, fontSize: 12 },
  hint: { color: colors.primary, marginTop: 10, fontSize: 12, fontWeight: '600' },
});
