import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useTeacherContacts } from '../../hooks/useTeacherQueries';
import { createConversation, db, ensureFirebaseAuth } from '../../api/firebase';
import { Card } from '../../components/Card';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { colors, radius } from '../../theme';
import { relativeTime } from '../../utils/format';

export function TeacherChatListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, school } = useAuth();
  const contacts = useTeacherContacts();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [queryText, setQueryText] = useState('');
  const schoolId = school?.id;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id || !schoolId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        await ensureFirebaseAuth();
        const ref = collection(db, 'schools', schoolId, 'conversations');
        const q = query(ref, where('participants', 'array-contains', user.id), limit(50));
        const snap = await getDocs(q);
        if (cancelled) return;
        const rows = snap.docs
          .map((d) => ({ id: d.id, schoolId, ...d.data() }))
          .sort((a: any, b: any) => {
            const ta = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
            const tb = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
            return tb - ta;
          });
        setConversations(rows);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Unable to load messages.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, schoolId]);

  const startChat = async (parentId: string, name: string) => {
    const conversationId = await createConversation(parentId);
    navigation.navigate('ChatThread', { conversationId, schoolId, name });
  };

  const filteredConvos = conversations.filter((conv) =>
    otherName(conv, user?.id).toLowerCase().includes(queryText.toLowerCase()),
  );
  const filteredContacts = (contacts.data?.contacts ?? []).filter((item) =>
    item.name.toLowerCase().includes(queryText.toLowerCase()),
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Chat</Text>
        <View style={styles.search}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            placeholder="Search parents"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={queryText}
            onChangeText={setQueryText}
            style={styles.searchInput}
          />
        </View>
      </View>
      <FlatList
        data={filteredConvos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.body}
        ListHeaderComponent={
          <>
            {filteredContacts.length > 0 ? <Text style={styles.section}>Parents you can message</Text> : null}
            {filteredContacts.slice(0, 8).map((item) => (
              <Card key={item.id} style={{ marginBottom: 10 }} onPress={() => startChat(item.id, item.name)}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.role || 'Parent'}</Text>
              </Card>
            ))}
            <Text style={styles.section}>Messages</Text>
            {loading ? <LoadingState /> : null}
            {error ? <ErrorState message={error} /> : null}
          </>
        }
        ListEmptyComponent={!loading ? <EmptyState title="No conversations yet" icon="chatbubbles-outline" /> : null}
        renderItem={({ item }) => (
          <Card
            style={{ marginBottom: 10 }}
            onPress={() =>
              navigation.navigate('ChatThread', {
                conversationId: item.id,
                schoolId,
                name: otherName(item, user?.id),
              })
            }
          >
            <View style={styles.rowBetween}>
              <Text style={styles.name}>{otherName(item, user?.id)}</Text>
              <Text style={styles.meta}>{relativeTime(item.updatedAt?.toDate?.() ?? item.updatedAt)}</Text>
            </View>
            <Text numberOfLines={1} style={styles.meta}>
              {item.lastMessage?.content || 'No messages yet'}
            </Text>
          </Card>
        )}
      />
    </View>
  );
}

function otherName(conv: any, userId?: string) {
  const members = conv.participantMeta || conv.memberInfo || conv.members || {};
  const otherId = (conv.participants || []).find((id: string) => id !== userId);
  return members[otherId]?.name || conv.name || conv.title || 'Parent';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: colors.white, fontSize: 24, fontWeight: '800' },
  search: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, color: colors.white, paddingVertical: 8 },
  body: { padding: 16, paddingBottom: 40 },
  section: { fontWeight: '800', color: colors.text, marginBottom: 10, marginTop: 8 },
  name: { fontWeight: '800', color: colors.text },
  meta: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
});
