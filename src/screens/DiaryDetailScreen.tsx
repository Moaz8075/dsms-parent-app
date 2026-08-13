import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { colors } from '../theme';
import { fileSize, formatDate } from '../utils/format';
import type { DiaryItem } from '../types';

export function DiaryDetailScreen({ navigation, route }: any) {
  const item: DiaryItem = route.params.item;
  const date: string = route.params.date;

  return (
    <View style={styles.root}>
      <ScreenHeader title="Diary" subtitle="Homework detail" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.tags}>
          <Badge label={item.type} />
          {item.category ? <Badge label={item.category} tone="info" /> : null}
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>
          {item.childName} · {item.schoolName} · {formatDate(date)}
        </Text>
        {item.content ? <Text style={styles.content}>{item.content}</Text> : null}

        {item.attachments?.length ? (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.section}>Attached files</Text>
            {item.attachments.map((file) => (
              <Card key={file.fileUrl} style={{ marginTop: 10 }} onPress={() => Linking.openURL(file.fileUrl)}>
                <View style={styles.fileRow}>
                  <Ionicons name="document-text-outline" size={22} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileName}>{file.fileName}</Text>
                    <Text style={styles.meta}>{fileSize(file.size)}</Text>
                  </View>
                  <Ionicons name="download-outline" size={20} color={colors.primary} />
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: 20, paddingBottom: 40 },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  meta: { color: colors.textMuted, marginTop: 8 },
  content: { color: colors.text, marginTop: 16, lineHeight: 22, fontSize: 15 },
  section: { fontWeight: '800', color: colors.text, fontSize: 16 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileName: { fontWeight: '700', color: colors.text },
});
