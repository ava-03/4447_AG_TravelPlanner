import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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

function parseDate(value: string) {
  const parts = value.split('-');

  if (parts[0]?.length === 4) {
    return new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );
  }

  return new Date(
    Number(parts[2]),
    Number(parts[1]) - 1,
    Number(parts[0])
  );
}

function formatDisplayDate(value: string) {
  const date = parseDate(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

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

  const [searchText, setSearchText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'not_completed'>('all');

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

    const sortedActivities = [...tripActivities].sort(
      (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()
    );

    setTrip(foundTrip);
    setActivities(sortedActivities);
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

  const categoryOptions = useMemo(() => {
    return Object.entries(categoryMap).map(([id, name]) => ({
      id: Number(id),
      name,
    }));
  }, [categoryMap]);

  const filteredActivities = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesText =
        normalizedSearch.length === 0 ||
        activity.title.toLowerCase().includes(normalizedSearch) ||
        (activity.notes ?? '').toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        selectedCategoryId === null || activity.categoryId === selectedCategoryId;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && activity.isCompleted === 1) ||
        (statusFilter === 'not_completed' && activity.isCompleted === 0);

      return matchesText && matchesCategory && matchesStatus;
    });
  }, [activities, searchText, selectedCategoryId, statusFilter]);

  function clearActivityFilters() {
    setSearchText('');
    setSelectedCategoryId(null);
    setStatusFilter('all');
  }

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
        <Pressable onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}>
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
        </Pressable>

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
        data={filteredActivities}
        keyExtractor={(item) => `activity-${item.id}`}
        renderItem={renderActivityItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.tripCard}>
              <Text style={styles.tripTitle}>{trip.name}</Text>
              <Text style={styles.tripDestination}>{trip.destination}</Text>
              <Text style={styles.tripDates}>
                {formatDisplayDate(trip.startDate)} → {formatDisplayDate(trip.endDate)}
              </Text>
              {trip.notes ? <Text style={styles.tripNotes}>{trip.notes}</Text> : null}
            </View>

            <View style={styles.tripActions}>
  <View style={styles.primaryActionRow}>
    <Pressable
      style={[styles.actionCard, styles.primaryAction]}
      onPress={() => navigation.navigate('AddActivity', { tripId: trip.id })}
    >
      <Text style={styles.primaryActionText}>+ Add Activity</Text>
    </Pressable>

    <Pressable
      style={[styles.actionCard, styles.primaryAction]}
      onPress={() => navigation.navigate('AddTarget', { tripId: trip.id })}
    >
      <Text style={styles.primaryActionText}>+ Add Target</Text>
    </Pressable>
  </View>

  <View style={styles.secondaryActionRow}>
    <Pressable
      style={[styles.actionCard, styles.secondaryAction]}
      onPress={() => navigation.navigate('EditTrip', { tripId: trip.id })}
    >
      <Text style={styles.secondaryActionText}>Edit Trip</Text>
    </Pressable>

    <Pressable
      style={[styles.actionCard, styles.deleteAction]}
      onPress={handleDeleteTrip}
    >
      <Text style={styles.deleteActionText}>Delete Trip</Text>
    </Pressable>
  </View>
</View>

            <Text style={styles.sectionTitle}>Activities</Text>

            <View style={styles.filtersCard}>
  <TextInput
    style={styles.input}
    placeholder="Search activities"
    value={searchText}
    onChangeText={setSearchText}
    accessibilityLabel="Search trip activities input"
  />

  <Text style={styles.filterLabel}>Category</Text>
  <View style={styles.filterChipsRow}>
    <Pressable
      style={[
        styles.filterChip,
        selectedCategoryId === null && styles.filterChipActive,
      ]}
      onPress={() => setSelectedCategoryId(null)}
    >
      <Text
        style={[
          styles.filterChipText,
          selectedCategoryId === null && styles.filterChipTextActive,
        ]}
      >
        All
      </Text>
    </Pressable>

    {categoryOptions.map((category) => (
      <Pressable
        key={category.id}
        style={[
          styles.filterChip,
          selectedCategoryId === category.id && styles.filterChipActive,
        ]}
        onPress={() => setSelectedCategoryId(category.id)}
      >
        <Text
          style={[
            styles.filterChipText,
            selectedCategoryId === category.id && styles.filterChipTextActive,
          ]}
        >
          {category.name}
        </Text>
      </Pressable>
    ))}
  </View>

  <Text style={styles.filterLabel}>Status</Text>
  <View style={styles.filterChipsRow}>
    <Pressable
      style={[
        styles.filterChip,
        statusFilter === 'all' && styles.filterChipActive,
      ]}
      onPress={() => setStatusFilter('all')}
    >
      <Text
        style={[
          styles.filterChipText,
          statusFilter === 'all' && styles.filterChipTextActive,
        ]}
      >
        All
      </Text>
    </Pressable>

    <Pressable
      style={[
        styles.filterChip,
        statusFilter === 'completed' && styles.filterChipActive,
      ]}
      onPress={() => setStatusFilter('completed')}
    >
      <Text
        style={[
          styles.filterChipText,
          statusFilter === 'completed' && styles.filterChipTextActive,
        ]}
      >
        Completed
      </Text>
    </Pressable>

    <Pressable
      style={[
        styles.filterChip,
        statusFilter === 'not_completed' && styles.filterChipActive,
      ]}
      onPress={() => setStatusFilter('not_completed')}
    >
      <Text
        style={[
          styles.filterChipText,
          statusFilter === 'not_completed' && styles.filterChipTextActive,
        ]}
      >
        Not Completed
      </Text>
    </Pressable>
  </View>

  <Pressable style={styles.clearFiltersButton} onPress={clearActivityFilters}>
    <Text style={styles.clearFiltersText}>Clear Filters</Text>
  </Pressable>
</View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matching activities</Text>
            <Text style={styles.emptyText}>
              Try changing the activity filters or add a new activity.
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
  marginBottom: 22,
  gap: 10,
},

primaryActionRow: {
  flexDirection: 'row',
  gap: 10,
},

secondaryActionRow: {
  flexDirection: 'row',
  gap: 10,
},

actionCard: {
  flex: 1,
  borderRadius: 14,
  paddingVertical: 14,
  paddingHorizontal: 12,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
},

primaryAction: {
  backgroundColor: '#111',
  borderColor: '#111',
},

primaryActionText: {
  color: '#fff',
  fontSize: 15,
  fontWeight: '700',
},

secondaryAction: {
  backgroundColor: '#fff',
  borderColor: '#d1d5db',
},

secondaryActionText: {
  color: '#2563eb',
  fontSize: 15,
  fontWeight: '700',
},

deleteAction: {
  backgroundColor: '#fff',
  borderColor: '#d1d5db',
},

deleteActionText: {
  color: '#dc2626',
  fontSize: 15,
  fontWeight: '700',
},
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 14,
  },
  filtersCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  filterLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: '#555',
  marginBottom: -4,
},

filterChipsRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
},

filterChip: {
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 999,
  backgroundColor: '#f3f4f6',
  borderWidth: 1,
  borderColor: '#e5e7eb',
},

filterChipActive: {
  backgroundColor: '#111',
  borderColor: '#111',
},

filterChipText: {
  fontSize: 14,
  color: '#333',
  fontWeight: '500',
},

filterChipTextActive: {
  color: '#fff',
},

clearFiltersButton: {
  alignSelf: 'flex-start',
  marginTop: 4,
},

clearFiltersText: {
  color: '#2563eb',
  fontSize: 15,
  fontWeight: '600',
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