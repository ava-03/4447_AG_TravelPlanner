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
import { deleteActivity, getActivitiesByTripId, getCategoryMapForUser } from '../utils/activities';
import { getCurrentUserId } from '../utils/authStorage';
import { deleteTrip, getTripById } from '../utils/trips';

type Props = {
  navigation: any;
  route: {
    params: {
      tripId: number;
    };
  };
};

type Trip = {
  id: number;
  userId: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string | null;
};

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

function formatDisplayDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}-${month}-${year}`;
}

export default function TripDetails({ navigation, route }: Props) {
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const userId = await getCurrentUserId();

    if (!userId) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }

    const foundTrip = await getTripById(tripId);

    if (!foundTrip) {
      Alert.alert('Not found', 'Trip could not be found.');
      navigation.goBack();
      return;
    }

    const tripActivities = await getActivitiesByTripId(tripId);
    const categories = await getCategoryMapForUser(userId);

    setTrip(foundTrip);
    setActivities(tripActivities);
    setCategoryMap(categories);
    setLoading(false);
  }, [navigation, tripId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  function handleDeleteTrip() {
    if (!trip) return;

    Alert.alert(
      'Delete trip',
      `Are you sure you want to delete "${trip.name}"? This will also delete all activities for this trip.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTrip(trip.id);
            navigation.goBack();
          },
        },
      ]
    );
  }

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
            await loadData();
          },
        },
      ]
    );
  }

  function renderActivityItem({ item }: { item: Activity }) {
    return (
      <View style={styles.activityCard}>
        <TouchableOpacity onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activityMeta}>
            {formatDisplayDate(item.date)} • {item.metricValue} mins
          </Text>
          <Text style={styles.activityMeta}>
            Category: {categoryMap[item.categoryId] ?? 'Unknown'}
          </Text>
          <Text style={styles.activityMeta}>
            Status: {item.isCompleted === 1 ? 'Completed' : 'Not completed'}
          </Text>
          {item.notes ? <Text style={styles.activityNotes}>{item.notes}</Text> : null}
        </TouchableOpacity>

        <View style={styles.activityButtons}>
          <View style={styles.activityButton}>
            <Button
              title="Edit"
              onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}
            />
          </View>
          <View style={styles.activityButton}>
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

  if (loading || !trip) {
    return (
      <ScreenContainer>
        <Text>Loading trip details...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={activities}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderActivityItem}
        ListHeaderComponent={
          <>
            <View style={styles.tripCard}>
              <Text style={styles.tripTitle}>{trip.name}</Text>
              <Text style={styles.tripDestination}>{trip.destination}</Text>
              <Text style={styles.tripDates}>
                {formatDisplayDate(trip.startDate)} to {formatDisplayDate(trip.endDate)}
              </Text>
              {trip.notes ? <Text style={styles.tripNotes}>{trip.notes}</Text> : null}
            </View>

            <View style={styles.tripActions}>
              <View style={styles.actionButton}>
                <Button
                  title="Add Activity"
                  onPress={() => navigation.navigate('AddActivity', { tripId: trip.id })}
                />
              </View>
              <View style={styles.actionButton}>
                <Button
                  title="Edit Trip"
                  onPress={() => navigation.navigate('EditTrip', { tripId: trip.id })}
                />
              </View>
              <View style={styles.actionButton}>
                <Button title="Delete Trip" color="#c62828" onPress={handleDeleteTrip} />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Activities</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptyText}>
              Tap "Add Activity" to add activities to this trip.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  tripTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  tripDestination: {
    fontSize: 18,
    marginBottom: 6,
  },
  tripDates: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
  },
  tripNotes: {
    fontSize: 15,
    color: '#333',
  },
  tripActions: {
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 14,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  activityTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  activityNotes: {
    fontSize: 14,
    color: '#333',
    marginTop: 6,
  },
  activityButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  activityButton: {
    flex: 1,
  },
  emptyState: {
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