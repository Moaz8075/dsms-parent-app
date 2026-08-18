import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { useTeacherClasses } from '../../hooks/useTeacherQueries';
import { colors, radius } from '../../theme';

export function TeacherClassesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch } = useTeacherClasses();
  const classes = data?.classes ?? [];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>My Classes</Text>
        <Text style={styles.sub}>{data?.total ?? classes.length} assigned class-subjects</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /> : null}
        {!isLoading && classes.length === 0 ? (
          <EmptyState title="No classes assigned" subtitle="Ask your school admin to assign subjects." icon="school-outline" />
        ) : (
          classes.map((item) => (
            <Card
              key={item.id}
              style={{ marginBottom: 12 }}
              onPress={() =>
                navigation.navigate('TeacherStudents', {
                  classId: item.classId,
                  grade: item.grade,
                  title: item.title,
                })
              }
            >
              <View style={styles.rowBetween}>
                <Text style={styles.grade}>{item.grade}</Text>
                <View style={styles.count}>
                  <Ionicons name="people-outline" size={14} color={colors.primary} />
                  <Text style={styles.countText}>{item.students}</Text>
                </View>
              </View>
              <Text style={styles.subject}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.room || 'Room TBA'}
                {item.nextSession?.when ? ` · Next: ${item.nextSession.when}` : ''}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 18 },
  title: { color: colors.white, fontSize: 24, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  body: { padding: 16, paddingBottom: 40 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grade: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  subject: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 6 },
  meta: { color: colors.textMuted, marginTop: 6 },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  countText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
});
