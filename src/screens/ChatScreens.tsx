import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useParentTeachers } from '../hooks/useParentQueries';
import {
  createConversation,
  db,
  ensureFirebaseAuth,
  notifyConversation,
} from '../api/firebase';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { Card } from '../components/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, radius } from '../theme';
import { usePushStatus } from '../notifications/push';
import { relativeTime } from '../utils/format';

export function ChatListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, activeChild, activeChildId } = useAuth();
  const teachers = useParentTeachers(activeChildId);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [queryText, setQueryText] = useState('');
  const schoolId = activeChild?.schoolId;

  useEffect(() => {
    if (!user?.id || !schoolId) {
      setLoading(false);
      return;
    }
    let unsub: (() => void) | undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    ensureFirebaseAuth(user.id)
      .then(() => {
        if (cancelled) return;
        const ref = collection(db, 'schools', schoolId, 'conversations');
        const q = query(ref, where('participants', 'array-contains', user.id), limit(50));
        unsub = onSnapshot(
          q,
          (snap) => {
            const rows = snap.docs
              .map((d) => ({ id: d.id, schoolId, ...d.data() }))
              .sort((a: any, b: any) => {
                const ta = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
                const tb = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
                return tb - ta;
              });
            setConversations(rows);
            setLoading(false);
          },
          (err) => {
            setError(err.message || 'Unable to load messages.');
            setLoading(false);
          },
        );
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || 'Unable to load messages.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [user?.id, schoolId]);

  const filtered = conversations.filter((conv) => {
    const name = otherName(conv, user?.id);
    return name.toLowerCase().includes(queryText.toLowerCase());
  });

  const startChat = async (teacherId: string, name: string) => {
    const conversationId = await createConversation(teacherId);
    navigation.navigate('ChatThread', {
      conversationId,
      schoolId,
      name,
    });
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Chat</Text>
          <ChildSwitcher compact />
        </View>
        <View style={styles.search}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            placeholder="Search teachers"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={queryText}
            onChangeText={setQueryText}
            style={styles.searchInput}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.body}
        ListHeaderComponent={
          <>
            {(teachers.data?.teachers ?? []).length > 0 ? (
              <Text style={styles.section}>Class teachers — {teachers.data?.className}</Text>
            ) : null}
            {(teachers.data?.teachers ?? []).map((teacher) => (
              <Card
                key={teacher.id}
                style={{ marginBottom: 10 }}
                onPress={() => startChat(teacher.id, teacher.name)}
              >
                <Text style={styles.name}>{teacher.name}</Text>
                <Text style={styles.meta}>
                  {teacher.isPrimary
                    ? 'Class teacher'
                    : teacher.subjects?.join(', ') || teacher.roleLabel || 'Teacher'}
                </Text>
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

export function ChatThreadScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { user, school, activeChild } = useAuth();
  const pushStatus = usePushStatus();
  const conversationId = route.params?.conversationId;
  const schoolId = route.params?.schoolId || school?.id || activeChild?.schoolId;
  const name = route.params?.name || 'Chat';
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!conversationId || !schoolId || !user?.id) return;
    let unsub: (() => void) | undefined;
    let cancelled = false;
    ensureFirebaseAuth(user.id).then(() => {
      if (cancelled) return;
      const msgRef = collection(db, 'schools', schoolId, 'conversations', conversationId, 'messages');
      const q = query(msgRef, orderBy('sentAt', 'desc'), limit(40));
      unsub = onSnapshot(
        q,
        (snap) => {
          const incoming = snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
          setMessages((prev) => {
            const locals = prev.filter(
              (item) =>
                String(item.id).startsWith('local-') &&
                !incoming.some((msg) => msg.senderId === item.senderId && msg.content === item.content),
            );
            return [...incoming, ...locals];
          });
        },
        () => {},
      );
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [conversationId, schoolId, user?.id]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user || !schoolId || !conversationId) return;
    setSending(true);
    setText('');
    const localId = `local-${Date.now()}`;
    const sentAt = Timestamp.now();
    setMessages((prev) => [
      ...prev,
      {
        id: localId,
        senderId: user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        content: trimmed,
        sentAt,
      },
    ]);
    try {
      await ensureFirebaseAuth(user.id);
      const msgRef = collection(db, 'schools', schoolId, 'conversations', conversationId, 'messages');
      await addDoc(msgRef, {
        senderId: user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        content: trimmed,
        sentAt,
        readBy: [user.id],
      });
      updateDoc(doc(db, 'schools', schoolId, 'conversations', conversationId), {
        lastMessage: {
          content: trimmed,
          senderId: user.id,
          senderName: `${user.firstName} ${user.lastName}`,
          sentAt: sentAt.toDate(),
        },
        updatedAt: sentAt,
      }).catch(() => {});
      notifyConversation(conversationId, {
        content: trimmed,
        senderName: `${user.firstName} ${user.lastName}`,
      }).catch(() => {});
    } catch {
      setMessages((prev) => prev.filter((item) => item.id !== localId));
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScreenHeader title={name} onBack={() => navigation.goBack()} />
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.thread}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => {
          const mine = item.senderId === user?.id;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={[styles.bubbleText, mine && { color: colors.white }]}>{item.content}</Text>
            </View>
          );
        }}
      />
      <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {pushStatus.lastNotify !== 'idle' ? (
          <Text
            style={[
              styles.notifyHint,
              pushStatus.lastNotify === 'failed' && styles.notifyFail,
            ]}
          >
            {pushStatus.lastNotify === 'ok' ? 'Push notify sent' : `Push notify failed: ${pushStatus.lastNotifyDetail}`}
          </Text>
        ) : null}
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
            style={styles.input}
          />
          <Pressable onPress={send} style={styles.send} disabled={sending}>
            {sending ? <ActivityIndicator color={colors.white} /> : <Ionicons name="send" size={18} color={colors.white} />}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function otherName(conv: any, userId?: string) {
  const members = conv.participantMeta || conv.memberInfo || conv.members || {};
  const otherId = (conv.participants || []).find((id: string) => id !== userId);
  return members[otherId]?.name || conv.name || conv.title || 'Teacher';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  thread: { padding: 16, gap: 8 },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.white },
  bubbleText: { color: colors.text, lineHeight: 20 },
  composerWrap: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notifyHint: {
    paddingHorizontal: 16,
    paddingTop: 8,
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  notifyFail: { color: colors.danger },
  composer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
