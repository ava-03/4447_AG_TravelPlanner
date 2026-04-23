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
import { exportTripActivitiesToCsv } from '../utils/exportCsv';
import { getTripInsights } from '../utils/insights';
import {
  createPackingItem,
  deletePackingItem,
  getPackingItemsByTripId,
  togglePackingItem,
} from '../utils/packing';
import {
  calculateTripTargetProgress,
  deleteTarget,
  getTargetsByTripId,
} from '../utils/targets';
import { deleteTrip, getTripById } from '../utils/trips';
import { useTheme } from '../theme/ThemeContext';

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

type PackingItem = {
  id: number;
  tripId: number;
  title: string;
  isChecked: number;
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
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDisplayDate(value: string) {
  const date = parseDate(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function differenceInDays(from: Date, to: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
}

function getTripStatus(startDate: string, endDate: string) {
  const today = startOfDay(new Date());
  const start = startOfDay(parseDate(startDate));
  const end = startOfDay(parseDate(endDate));

  if (today < start) return 'Upcoming';
  if (today > end) return 'Completed';
  return 'In Progress';
}

function getTripCountdown(startDate: string, endDate: string) {
  const today = startOfDay(new Date());
  const start = startOfDay(parseDate(startDate));
  const end = startOfDay(parseDate(endDate));

  if (today < start) {
    const days = differenceInDays(today, start);
    return days === 1 ? 'Starts tomorrow' : `Starts in ${days} days`;
  }

  if (today > end) {
    return 'Completed';
  }

  if (today.getTime() === end.getTime()) {
    return 'Ends today';
  }

  const daysLeft = differenceInDays(today, end);
  return daysLeft === 1 ? 'Ends tomorrow' : `Ends in ${daysLeft} days`;
}

export default function TripDetails({ navigation, route }: Props) {
  const { tripId } = route.params;
  const { colors, themeMode } = useTheme();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [newPackingItem, setNewPackingItem] = useState('');
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

    const [tripActivities, tripTargets, categories, tripInsights, tripPackingItems] =
      await Promise.all([
        getActivitiesByTripId(tripId),
        getTargetsByTripId(tripId),
        getCategoryMapForUser(userId),
        getTripInsights(tripId),
        getPackingItemsByTripId(tripId),
      ]);

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
    setPackingItems(tripPackingItems);
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

  async function handleAddPackingItem() {
    if (!newPackingItem.trim()) return;

    try {
      await createPackingItem(tripId, newPackingItem);
      setNewPackingItem('');
      await loadData();
    } catch {
      Alert.alert('Error', 'Failed to add packing item.');
    }
  }

  async function handleTogglePackingItem(item: PackingItem) {
    await togglePackingItem(item.id, item.isChecked);
    await loadData();
  }

  async function handleDeletePackingItem(item: PackingItem) {
    await deletePackingItem(item.id);
    await loadData();
  }

  async function handleExportCsv() {
    if (!trip) return;

    try {
      const exportRows = activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        date: activity.date,
        category: categoryMap[activity.categoryId] ?? 'Unknown',
        metricValue: activity.metricValue,
        metricUnit: activity.metricUnit,
        status: activity.isCompleted === 1 ? 'Completed' : 'Not completed',
        notes: activity.notes ?? '',
      }));

      await exportTripActivitiesToCsv(trip.name, exportRows);
      Alert.alert('Success', 'Trip activities exported successfully.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to export CSV.';
      Alert.alert('Export Error', message);
    }
  }

  function handleDeleteTrip() {
    if (!trip) return;

    Alert.alert(
      'Delete trip',
      `Are you sure you want to delete "${trip.name}"? This will also delete all activities, packing items and targets for this trip.`,
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
    if (status === 'Exceeded') return colors.danger;
    if (status === 'Met') return themeMode === 'dark' ? '#4ade80' : '#2e7d32';
    return colors.subtext;
  }

  function getTripBadgeColors(status: string) {
    if (status === 'Upcoming') {
      return {
        backgroundColor: themeMode === 'dark' ? '#1e3a5f' : '#dbeafe',
        textColor: themeMode === 'dark' ? '#93c5fd' : '#1d4ed8',
      };
    }

    if (status === 'In Progress') {
      return {
        backgroundColor: themeMode === 'dark' ? '#3f3a16' : '#fef3c7',
        textColor: themeMode === 'dark' ? '#fde68a' : '#92400e',
      };
    }

    return {
      backgroundColor: themeMode === 'dark' ? '#1f2937' : '#e5e7eb',
      textColor: themeMode === 'dark' ? '#d1d5db' : '#374151',
    };
  }

  function renderActivityItem({ item }: { item: Activity }) {
    return (
      <View
        style={[
          styles.activityCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Pressable onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}>
          <Text style={[styles.activityTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.activityMeta, { color: colors.subtext }]}>
            {formatDisplayDate(item.date)} • {item.metricValue} mins
          </Text>
          <Text style={[styles.activityMeta, { color: colors.subtext }]}>
            Category: {categoryMap[item.categoryId] ?? 'Unknown'}
          </Text>
          <Text style={[styles.activityMeta, { color: colors.subtext }]}>
            Status: {item.isCompleted === 1 ? 'Completed' : 'Not completed'}
          </Text>
          {item.notes ? (
            <Text style={[styles.activityNotes, { color: colors.subtext }]}>{item.notes}</Text>
          ) : null}
        </Pressable>

        <View style={styles.rowButtons}>
          <View style={styles.halfButton}>
            <Button
              title="Edit"
              color={colors.accent}
              onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}
            />
          </View>
          <View style={styles.halfButton}>
            <Button
              title="Delete"
              color={colors.danger}
              onPress={() => handleDeleteActivity(item.id, item.title)}
            />
          </View>
        </View>
      </View>
    );
  }

  function renderTargetItem({ item }: { item: TripTargetWithProgress }) {
    return (
      <View
        style={[
          styles.targetCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.targetTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.targetMeta, { color: colors.subtext }]}>
          Category: {item.categoryId ? categoryMap[item.categoryId] ?? 'Unknown' : 'All categories'}
        </Text>
        <Text style={[styles.targetMeta, { color: colors.subtext }]}>Goal: {item.goal} mins</Text>
        <Text style={[styles.targetMeta, { color: colors.subtext }]}>
          Current: {item.current} mins
        </Text>
        <Text style={[styles.targetMeta, { color: colors.subtext }]}>
          Remaining: {item.remaining} mins
        </Text>
        <Text style={[styles.targetStatus, { color: getStatusColor(item.status) }]}>
          Status: {item.status}
        </Text>

        <View style={styles.rowButtons}>
          <View style={styles.halfButton}>
            <Button
              title="Edit"
              color={colors.accent}
              onPress={() => navigation.navigate('EditTarget', { targetId: item.id })}
            />
          </View>
          <View style={styles.halfButton}>
            <Button
              title="Delete"
              color={colors.danger}
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
        <Text style={{ color: colors.text }}>Loading trip details...</Text>
      </ScreenContainer>
    );
  }

  const tripStatus = getTripStatus(trip.startDate, trip.endDate);
  const tripCountdown = getTripCountdown(trip.startDate, trip.endDate);
  const tripBadge = getTripBadgeColors(tripStatus);

  return (
    <ScreenContainer>
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => `activity-${item.id}`}
        renderItem={renderActivityItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View
              style={[
                styles.tripCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.tripHeaderRow}>
                <Text style={[styles.tripTitle, { color: colors.text }]}>{trip.name}</Text>
                <View style={[styles.tripStatusBadge, { backgroundColor: tripBadge.backgroundColor }]}>
                  <Text style={[styles.tripStatusBadgeText, { color: tripBadge.textColor }]}>
                    {tripStatus}
                  </Text>
                </View>
              </View>

              <Text style={[styles.tripDestination, { color: colors.text }]}>
                {trip.destination}
              </Text>

              <Text style={[styles.tripDates, { color: colors.subtext }]}>
                {formatDisplayDate(trip.startDate)} → {formatDisplayDate(trip.endDate)}
              </Text>

              <Text style={[styles.tripCountdown, { color: colors.accent }]}>
                {tripCountdown}
              </Text>

              {trip.notes ? (
                <Text style={[styles.tripNotes, { color: colors.subtext }]}>{trip.notes}</Text>
              ) : null}
            </View>

            <View style={styles.tripActions}>
              <View style={styles.primaryActionRow}>
                <Pressable
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: themeMode === 'dark' ? colors.accent : '#111',
                      borderColor: themeMode === 'dark' ? colors.accent : '#111',
                    },
                  ]}
                  onPress={() => navigation.navigate('AddActivity', { tripId: trip.id })}
                >
                  <Text
                    style={[
                      styles.primaryActionText,
                      { color: themeMode === 'dark' ? '#0f1115' : '#ffffff' },
                    ]}
                  >
                    + Add Activity
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: themeMode === 'dark' ? colors.accent : '#111',
                      borderColor: themeMode === 'dark' ? colors.accent : '#111',
                    },
                  ]}
                  onPress={() => navigation.navigate('AddTarget', { tripId: trip.id })}
                >
                  <Text
                    style={[
                      styles.primaryActionText,
                      { color: themeMode === 'dark' ? '#0f1115' : '#ffffff' },
                    ]}
                  >
                    + Add Target
                  </Text>
                </Pressable>
              </View>

              <View style={styles.secondaryActionRow}>
                <Pressable
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => navigation.navigate('EditTrip', { tripId: trip.id })}
                >
                  <Text style={[styles.secondaryActionText, { color: colors.accent }]}>
                    Edit Trip
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={handleExportCsv}
                >
                  <Text style={[styles.secondaryActionText, { color: colors.accent }]}>
                    Export CSV
                  </Text>
                </Pressable>
              </View>

              <View style={styles.deleteRow}>
                <Pressable
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={handleDeleteTrip}
                >
                  <Text style={[styles.deleteActionText, { color: colors.danger }]}>
                    Delete Trip
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Packing List</Text>

            <View
              style={[
                styles.packingCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.packingInputRow}>
                <TextInput
                  style={[
                    styles.packingInput,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Add packing item"
                  placeholderTextColor={colors.placeholder}
                  value={newPackingItem}
                  onChangeText={setNewPackingItem}
                />
                <Pressable
                  style={[styles.addPackingButton, { backgroundColor: colors.accent }]}
                  onPress={handleAddPackingItem}
                >
                  <Text style={styles.addPackingButtonText}>Add</Text>
                </Pressable>
              </View>

              {packingItems.length === 0 ? (
                <Text style={[styles.packingEmptyText, { color: colors.subtext }]}>
                  No packing items yet.
                </Text>
              ) : (
                packingItems.map((item) => (
                  <View key={item.id} style={styles.packingItemRow}>
                    <Pressable
                      style={styles.packingLeft}
                      onPress={() => handleTogglePackingItem(item)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: item.isChecked === 1 ? colors.accent : colors.border,
                            backgroundColor: item.isChecked === 1 ? colors.accent : 'transparent',
                          },
                        ]}
                      >
                        {item.isChecked === 1 ? (
                          <Text style={styles.checkboxTick}>✓</Text>
                        ) : null}
                      </View>

                      <Text
                        style={[
                          styles.packingItemText,
                          {
                            color: colors.text,
                            textDecorationLine: item.isChecked === 1 ? 'line-through' : 'none',
                            opacity: item.isChecked === 1 ? 0.7 : 1,
                          },
                        ]}
                      >
                        {item.title}
                      </Text>
                    </Pressable>

                    <Pressable onPress={() => handleDeletePackingItem(item)}>
                      <Text style={[styles.deletePackingText, { color: colors.danger }]}>
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Activities</Text>

            <View
              style={[
                styles.filtersCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Search activities"
                placeholderTextColor={colors.placeholder}
                value={searchText}
                onChangeText={setSearchText}
                accessibilityLabel="Search trip activities input"
              />

              <Text style={[styles.filterLabel, { color: colors.subtext }]}>Category</Text>
              <View style={styles.filterChipsRow}>
                <Pressable
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: colors.chip,
                      borderColor: colors.border,
                    },
                    selectedCategoryId === null && {
                      backgroundColor: colors.chipActive,
                      borderColor: colors.chipActive,
                    },
                  ]}
                  onPress={() => setSelectedCategoryId(null)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: colors.chipText },
                      selectedCategoryId === null && { color: colors.chipTextActive },
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
                      {
                        backgroundColor: colors.chip,
                        borderColor: colors.border,
                      },
                      selectedCategoryId === category.id && {
                        backgroundColor: colors.chipActive,
                        borderColor: colors.chipActive,
                      },
                    ]}
                    onPress={() => setSelectedCategoryId(category.id)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: colors.chipText },
                        selectedCategoryId === category.id && { color: colors.chipTextActive },
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.filterLabel, { color: colors.subtext }]}>Status</Text>
              <View style={styles.filterChipsRow}>
                <Pressable
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: colors.chip,
                      borderColor: colors.border,
                    },
                    statusFilter === 'all' && {
                      backgroundColor: colors.chipActive,
                      borderColor: colors.chipActive,
                    },
                  ]}
                  onPress={() => setStatusFilter('all')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: colors.chipText },
                      statusFilter === 'all' && { color: colors.chipTextActive },
                    ]}
                  >
                    All
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: colors.chip,
                      borderColor: colors.border,
                    },
                    statusFilter === 'completed' && {
                      backgroundColor: colors.chipActive,
                      borderColor: colors.chipActive,
                    },
                  ]}
                  onPress={() => setStatusFilter('completed')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: colors.chipText },
                      statusFilter === 'completed' && { color: colors.chipTextActive },
                    ]}
                  >
                    Completed
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: colors.chip,
                      borderColor: colors.border,
                    },
                    statusFilter === 'not_completed' && {
                      backgroundColor: colors.chipActive,
                      borderColor: colors.chipActive,
                    },
                  ]}
                  onPress={() => setStatusFilter('not_completed')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: colors.chipText },
                      statusFilter === 'not_completed' && { color: colors.chipTextActive },
                    ]}
                  >
                    Not Completed
                  </Text>
                </Pressable>
              </View>

              <Pressable style={styles.clearFiltersButton} onPress={clearActivityFilters}>
                <Text style={[styles.clearFiltersText, { color: colors.accent }]}>
                  Clear Filters
                </Text>
              </Pressable>
            </View>
          </>
        }
        ListEmptyComponent={
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No matching activities</Text>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Try changing the activity filters or add a new activity.
            </Text>
          </View>
        }
        ListFooterComponent={
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Targets</Text>

            {targets.length === 0 ? (
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No targets yet</Text>
                <Text style={[styles.emptyText, { color: colors.subtext }]}>
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

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Insights</Text>

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
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  tripTitle: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
  },
  tripStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tripStatusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tripDestination: {
    fontSize: 18,
    marginBottom: 6,
  },
  tripDates: {
    fontSize: 15,
    marginBottom: 6,
  },
  tripCountdown: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  tripNotes: {
    fontSize: 15,
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
  deleteRow: {
    flexDirection: 'row',
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
  primaryActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 14,
  },
  packingCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  packingInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  packingInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  addPackingButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPackingButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  packingEmptyText: {
    fontSize: 15,
  },
  packingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  packingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  packingItemText: {
    fontSize: 16,
    flex: 1,
  },
  deletePackingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filtersCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
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
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  clearFiltersText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activityCard: {
    borderWidth: 1,
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
    marginBottom: 4,
  },
  activityNotes: {
    fontSize: 14,
    marginTop: 6,
  },
  targetCard: {
    borderWidth: 1,
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
    borderRadius: 14,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
  },
});