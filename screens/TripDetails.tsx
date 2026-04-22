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
import TripInsightsCard from '../components/TripInsightsCard';
import {
  deleteActivity,
  getActivitiesByTripId,
  getCategoryMapForUser,
} from '../utils/activities';
import { getCurrentUserId } from '../utils/authStorage';
import { getTripInsights } from '../utils/insights';
import {
  calculateTripTargetProgress,
  deleteTarget,
  getTargetsByTripId,
} from '../utils/targets';
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

type TripTarget = {
  id: number;
  userId: number;
  tripId: number;
  categoryId: number | null;
  period: string;
  metricType: string;
  goal: number;
  title: string;
};

type TripTargetWithProgress = TripTarget & {
  current: number;
  remaining: number;
  status: 'Unmet' | 'Met' | 'Exceeded';
};

type TripInsights = {
  totalMinutes: number;
  totalActivities: number;
  completedActivities: number;
  busiestCategory: string;
  minutesByCategory: { name: string; minutes: number }[];
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
  const [targets, setTargets] = useState<TripTargetWithProgress[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [insights, setInsights] = useState<TripInsights | null>(null);
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
    const tripTargets = await getTargetsByTripId(tripId);
    const categories = await getCategoryMapForUser(userId);
    const tripInsights = await getTripInsights(tripId);

    const targetsWithProgress = await Promise.all(
      tripTargets.map(async (target: TripTarget) => {
        const progress = await calculateTripTargetProgress(target);
        return {
          ...target,
          ...progress,
        };
      })
    );

    setTrip(foundTrip);
    setActivities(tripActivities);
    setTargets(targetsWithProgress);
    setCategoryMap(categories);
    setInsights(tripInsights);
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
      `Are you sure you want to delete "${trip.name}"? This will also delete all activities and targets for this trip.`,
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

  function handleDeleteTarget(targetId: number, title: string) {
    Alert.alert(
      'Delete target',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTarget(targetId);
            await loadData();
          },
        },
      ]
    );
  }

  function getStatusColor(status: 'Unmet' | 'Met' | 'Exceeded') {
    if (status === 'Exceeded') return '#c62828';
    if (status === 'Met') return '#2e7d32';
    return '#555';
  }

  function renderActivityItem({ item }: { item: Activity }) {
    return (
      <View style={styles.activityCard}>
        <TouchableOpacity
          onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}
        >
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

        <View style={styles.rowButtons}>
          <View style={styles.halfButton}>
            <Button
              title="Edit"
              onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}
            />
          </View>
          <View style={styles.halfButton}>
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

  function renderTargetItem({ item }: { item: TripTargetWithProgress }) {
    return (
      <View style={styles.targetCard}>
        <Text style={styles.targetTitle}>{item.title}</Text>
        <Text style={styles.targetMeta}>
          Category: {item.categoryId ? categoryMap[item.categoryId] ?? 'Unknown' : 'All categories'}
        </Text>
        <Text style={styles.targetMeta}>Goal: {item.goal} mins</Text>
        <Text style={styles.targetMeta}>Current: {item.current} mins</Text>
        <Text style={styles.targetMeta}>Remaining: {item.remaining} mins</Text>
        <Text style={[styles.targetStatus, { color: getStatusColor(item.status) }]}>
          Status: {item.status}
        </Text>

        <View style={styles.rowButtons}>
          <View style={styles.halfButton}>
            <Button
              title="Edit"
              onPress={() => navigation.navigate('EditTarget', { targetId: item.id })}
            />
          </View>
          <View style={styles.halfButton}>
            <Button
              title="Delete"
              color="#c62828"
              onPress={() => handleDeleteTarget(item.id, item.title)}
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
        keyExtractor={(item) => `activity-${item.id}`}
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
                  title="Add Target"
                  onPress={() => navigation.navigate('AddTarget', { tripId: trip.id })}
                />
              </View>

              <View style={styles.actionButton}>
                <Button
                  title="Edit Trip"
                  onPress={() => navigation.navigate('EditTrip', { tripId: trip.id })}
                />
              </View>

              <View style={styles.actionButton}>
                <Button
                  title="Delete Trip"
                  color="#c62828"
                  onPress={handleDeleteTrip}
                />
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
        ListFooterComponent={
          <>
            <Text style={styles.sectionTitle}>Targets</Text>

            {targets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No targets yet</Text>
                <Text style={styles.emptyText}>
                  Add a target to track how busy or balanced this trip is.
                </Text>
              </View>
            ) : (
              targets.map((target) => (
                <View key={`target-${target.id}`}>
                  {renderTargetItem({ item: target })}
                </View>
              ))
            )}

            <Text style={styles.sectionTitle}>Insights</Text>

            {insights ? (
              <TripInsightsCard
                totalMinutes={insights.totalMinutes}
                totalActivities={insights.totalActivities}
                completedActivities={insights.completedActivities}
                busiestCategory={insights.busiestCategory}
                minutesByCategory={insights.minutesByCategory}
              />
            ) : null}
          </>
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
  targetCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  targetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  targetMeta: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  targetStatus: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  halfButton: {
    flex: 1,
  },
  emptyState: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 16,
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