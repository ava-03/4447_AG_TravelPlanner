import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { deleteActivity, getActivitiesByUserId } from '../utils/activities';
import { getCurrentUserId } from '../utils/authStorage';

type Activity = {
  id: number;
  tripId: number;
  categoryId: number;
  title: string;
  date: string;
  metricValue: number;
  metricUnit: string;
  notes: string | null;
  isCompleted: number;
};

type Props = {
  navigation: any;
};

function formatDisplayDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}-${month}-${year}`;
}

export default function Activities({ navigation }: Props) {
  const [activityList, setActivityList] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    const userId = await getCurrentUserId();

    if (!userId) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }

    const rows = await getActivitiesByUserId(userId);
    setActivityList(rows);
    setLoading(false);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  function handleDeleteActivity(activityId: number, title: string) {
    Alert.alert(
      'Delete activity',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteActivity(activityId);
            await loadActivities();
          },
        },
      ]
    );
  }

  function renderActivityItem({ item }: { item: Activity }) {
    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>
            {item.metricValue} {item.metricUnit}
          </Text>
          <Text style={styles.cardDate}>{formatDisplayDate(item.date)}</Text>
          <Text style={styles.cardStatus}>
            {item.isCompleted === 1 ? 'Completed' : 'Not completed'}
          </Text>
          {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
        </TouchableOpacity>

        <View style={styles.cardButtons}>
          <View style={styles.cardButton}>
            <Button title="Edit" onPress={() => navigation.navigate('EditActivity', { activityId: item.id })} />
          </View>
          <View style={styles.cardButton}>
            <Button
              title="Delete"
              color="#c62828"
              onPress={() => handleDeleteActivity(item.id, item.title)}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Activities</Text>
        <Button title="Add Activity" onPress={() => navigation.navigate('AddActivity')} />
      </View>

      {loading ? (
        <Text>Loading activities...</Text>
      ) : activityList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No activities yet</Text>
          <Text style={styles.emptyText}>Tap "Add Activity" to create your first activity.</Text>
        </View>
      ) : (
        <FlatList
          data={activityList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderActivityItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  cardStatus: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 8,
  },
  cardNotes: {
    fontSize: 14,
    color: '#333',
  },
  cardButtons: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  cardButton: {
    flex: 1,
  },
  emptyState: {
    marginTop: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
  },
});