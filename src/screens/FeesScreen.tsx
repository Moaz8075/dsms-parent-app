import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge, statusTone } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { Field } from '../components/Field';
import { KeyboardScreen } from '../components/KeyboardScreen';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useParentFees, useSubmitPaymentReceipt } from '../hooks/useParentQueries';
import { colors } from '../theme';
import { formatMoney } from '../utils/format';
import { shareVoucherPdf } from '../utils/voucherPdf';
import type { Invoice } from '../types';

export function FeesScreen({ navigation }: any) {
  const { activeChildId, activeChild } = useAuth();
  const { data, isLoading, isError, error, refetch } = useParentFees(activeChildId);
  const submit = useSubmitPaymentReceipt(activeChildId);
  const invoices = (data?.invoices ?? []).filter((inv) => inv.remaining > 0);
  const current = invoices[0];
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<{ fileName: string; fileUrl: string; mimeType?: string; size?: number } | null>(
    null,
  );

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) return;
    const picked = result.assets[0];
    setFile({
      fileName: picked.name,
      fileUrl: `https://example.com/uploads/${encodeURIComponent(picked.name)}`,
      mimeType: picked.mimeType ?? undefined,
      size: picked.size,
    });
  };

  const [busyId, setBusyId] = useState<string | null>(null);
  const download = async (inv: Invoice) => {
    if (!data) return;
    setBusyId(inv.id);
    try {
      await shareVoucherPdf(data, inv);
    } catch (err: any) {
      Alert.alert('Could not create voucher', err?.message || 'Try again.');
    } finally {
      setBusyId(null);
    }
  };
  const bank = data?.bank;
  const hasBank = !!(bank && (bank.bankName || bank.accountNumber || bank.iban));

  const upload = async () => {
    if (!current || !file) {
      Alert.alert('Receipt required', 'Choose a receipt file before submitting.');
      return;
    }
    try {
      await submit.mutateAsync({
        invoiceId: current.id,
        amount: current.remaining,
        notes,
        receipt: file,
      });
      setFile(null);
      setNotes('');
      Alert.alert('Submitted', 'Your receipt was sent for school verification.');
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message || 'Try again.');
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardScreen
        header={
          <ScreenHeader
            title="Fees"
            subtitle={activeChild ? `${activeChild.name} · ${activeChild.grade}` : undefined}
            onBack={() => navigation.goBack()}
          />
        }
        contentContainerStyle={styles.body}
      >
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}

        <Card style={styles.hero}>
          <Text style={styles.heroLabel}>Current due</Text>
          <Text style={styles.heroValue}>{formatMoney(data?.summary.totalDue)}</Text>
          <Badge label={data?.summary.totalDue ? 'UNPAID' : 'PAID'} tone={data?.summary.totalDue ? 'warning' : 'success'} />
        </Card>

        <View style={styles.row}>
          <Mini label="Billed" value={formatMoney(data?.summary.totalBilled)} />
          <Mini label="Paid" value={formatMoney(data?.summary.totalPaid)} />
        </View>

        {current ? (
          <>
            <Text style={styles.section}>Invoice breakdown</Text>
            <Card>
              <Text style={styles.invoiceNo}>{current.invoiceNumber}</Text>
              {current.items.map((item, idx) => (
                <View key={`${item.description}-${idx}`} style={styles.itemRow}>
                  <Text style={[styles.itemName, item.isArrears && { color: colors.danger, fontWeight: '700' }]}>{item.description}</Text>
                  <Text style={[styles.itemAmt, item.isArrears && { color: colors.danger }]}>{formatMoney(item.amount)}</Text>
                </View>
              ))}
              {(current.discount ?? 0) > 0 ? (
                <View style={styles.itemRow}>
                  <Text style={styles.itemName}>Discount</Text>
                  <Text style={styles.itemAmt}>- {formatMoney(current.discount)}</Text>
                </View>
              ) : null}
              {(current.lateFee ?? 0) > 0 ? (
                <View style={styles.itemRow}>
                  <Text style={styles.itemName}>Late fee</Text>
                  <Text style={styles.itemAmt}>{formatMoney(current.lateFee)}</Text>
                </View>
              ) : null}
              {current.paidAmount > 0 ? (
                <View style={styles.itemRow}>
                  <Text style={styles.itemName}>Already paid</Text>
                  <Text style={styles.itemAmt}>- {formatMoney(current.paidAmount)}</Text>
                </View>
              ) : null}
              <View style={styles.itemRow}>
                <Text style={[styles.itemName, { fontWeight: '800' }]}>Payable</Text>
                <Text style={[styles.itemAmt, { fontWeight: '800' }]}>{formatMoney(current.remaining)}</Text>
              </View>
              <View style={{ height: 10 }} />
              <PrimaryButton
                title="Download voucher (3 copies)"
                variant="outline"
                icon="download-outline"
                loading={busyId === current.id}
                onPress={() => download(current)}
              />
            </Card>

            {hasBank ? (
              <>
                <Text style={styles.section}>Deposit in bank</Text>
                <Card>
                  {bank?.bankName ? <Text style={styles.itemName}>{bank.bankName}{bank.branchName ? `, ${bank.branchName}` : ''}{bank.branchCode ? ` (${bank.branchCode})` : ''}</Text> : null}
                  {bank?.accountTitle ? <Text style={styles.help}>Account title: {bank.accountTitle}</Text> : null}
                  {bank?.accountNumber ? <Text style={styles.help} selectable>Account no.: {bank.accountNumber}</Text> : null}
                  {bank?.iban ? <Text style={styles.help} selectable>IBAN: {bank.iban}</Text> : null}
                  {bank?.instructions ? <Text style={styles.help}>{bank.instructions}</Text> : null}
                </Card>
              </>
            ) : null}

            <Text style={styles.section}>Upload receipt</Text>
            <Text style={styles.help}>
              Pay at the bank with the voucher (or pay as your school instructs), then upload the receipt
              for verification — same as the parent web portal.
            </Text>
            <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional note" />
            <PrimaryButton
              title={file ? file.fileName : 'Select file'}
              variant="outline"
              onPress={pickFile}
              icon="attach-outline"
            />
            <View style={{ height: 12 }} />
            <PrimaryButton title="Submit receipt" loading={submit.isPending} onPress={upload} />
          </>
        ) : !isLoading ? (
          <EmptyState title="No outstanding fees" subtitle="You’re all caught up." icon="checkmark-circle-outline" />
        ) : null}

        {(data?.invoices ?? []).length > 0 ? (
          <>
            <Text style={styles.section}>All invoices</Text>
            {data?.invoices.map((inv) => (
              <Card key={inv.id} style={{ marginBottom: 10 }}>
                <View style={styles.itemRow}>
                  <View>
                    <Text style={styles.itemName}>{inv.invoiceNumber}</Text>
                    <Text style={styles.help}>{inv.dueDate ? `Due ${inv.dueDate}` : ''}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.itemAmt}>{formatMoney(inv.remaining)}</Text>
                    <Badge label={inv.status} tone={statusTone(inv.status)} />
                  </View>
                </View>
                {inv.remaining > 0 && inv.id !== current?.id ? (
                  <PrimaryButton
                    title="Download voucher"
                    variant="outline"
                    icon="download-outline"
                    loading={busyId === inv.id}
                    onPress={() => download(inv)}
                  />
                ) : null}
              </Card>
            ))}
          </>
        ) : null}
      </KeyboardScreen>
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1 }}>
      <Text style={styles.help}>{label}</Text>
      <Text style={styles.itemName}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, paddingBottom: 40 },
  hero: { backgroundColor: colors.primary, marginBottom: 12 },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontWeight: '700' },
  heroValue: { color: colors.white, fontSize: 32, fontWeight: '800', marginVertical: 8 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  section: { fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 10, fontSize: 16 },
  help: { color: colors.textMuted, marginBottom: 12, lineHeight: 20 },
  invoiceNo: { fontWeight: '800', color: colors.text, marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { fontWeight: '700', color: colors.text },
  itemAmt: { fontWeight: '800', color: colors.primary },
});
