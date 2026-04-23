import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
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
import { exportTripDataToCsv } from '../utils/exportCsv';
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

function isValidDateInput(value: string) {
  if (!value.trim()) return false;

  const parsed = parseDate(value);
  return !Number.isNaN(parsed.getTime());
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
  const { themeMode } = useTheme();

  // Screen palette
  const palette = themeMode === 'dark'
    ? {
        page: '#0F172A',
        hero: '#132A46',
        heroBorder: '#1F3D63',
        surface: '#111C2D',
        card: '#17263D',
        border: '#28405F',
        text: '#F8FAFC',
        subtext: '#C7D2E0',
        accent: '#D4A853',
        primary: '#C4622D',
        primaryText: '#FFFFFF',
        blue: '#3B82F6',
        blueSoft: '#1E3A5F',
        blueText: '#93C5FD',
        yellowSoft: '#4A3E18',
        yellowText: '#F7D774',
        graySoft: '#334155',
        grayText: '#E2E8F0',
        danger: '#FCA5A5',
        dangerSoft: '#2A1E24',
        dangerBorder: '#5B3340',
        input: '#10233A',
        placeholder: '#8FA0B6',
        chip: '#13233A',
        chipActive: '#C4622D',
        chipText: '#C7D2E0',
        chipTextActive: '#FFFFFF',
        success: '#86EFAC',
      }
    : {
        page: '#F5F0E8',
        hero: '#1A2E44',
        heroBorder: '#1A2E44',
        surface: '#FFFDF9',
        card: '#FFFFFF',
        border: '#DDD6CA',
        text: '#18212B',
        subtext: '#6B7280',
        accent: '#D4A853',
        primary: '#C4622D',
        primaryText: '#FFFFFF',
        blue: '#2563EB',
        blueSoft: '#DBEAFE',
        blueText: '#1D4ED8',
        yellowSoft: '#FEF3C7',
        yellowText: '#92400E',
        graySoft: '#E5E7EB',
        grayText: '#374151',
        danger: '#C24141',
        dangerSoft: '#FFF5F5',
        dangerBorder: '#F3C7C7',
        input: '#FFFFFF',
        placeholder: '#9CA3AF',
        chip: '#FFFFFF',
        chipActive: '#C4622D',
        chipText: '#4B5563',
        chipTextActive: '#FFFFFF',
        success: '#166534',
      };

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
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Load all trip data together
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

  // Build category chips here
  const categoryOptions = useMemo(() => {
    return Object.entries(categoryMap).map(([id, name]) => ({
      id: Number(id),
      name,
    }));
  }, [categoryMap]);

  // Filter activities here
  const filteredActivities = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const parsedStartFilter = isValidDateInput(startDateFilter)
      ? startOfDay(parseDate(startDateFilter))
      : null;
    const parsedEndFilter = isValidDateInput(endDateFilter)
      ? startOfDay(parseDate(endDateFilter))
      : null;

    return activities.filter((activity) => {
      const activityDate = startOfDay(parseDate(activity.date));

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

      const matchesStartDate =
        parsedStartFilter === null || activityDate >= parsedStartFilter;

      const matchesEndDate =
        parsedEndFilter === null || activityDate <= parsedEndFilter;

      return (
        matchesText &&
        matchesCategory &&
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    activities,
    searchText,
    selectedCategoryId,
    statusFilter,
    startDateFilter,
    endDateFilter,
  ]);

  // Clear all activity filters
  function clearActivityFilters() {
    setSearchText('');
    setSelectedCategoryId(null);
    setStatusFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
  }

  // Add packing item
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

  // Tick or untick packing item
  async function handleTogglePackingItem(item: PackingItem) {
    await togglePackingItem(item.id, item.isChecked);
    await loadData();
  }

  // Delete packing item
  async function handleDeletePackingItem(item: PackingItem) {
    await deletePackingItem(item.id);
    await loadData();
  }

  // Export trip data to csv
  async function handleExportCsv() {
    if (!trip) return;

    try {
      const activityRows = activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        date: activity.date,
        category: categoryMap[activity.categoryId] ?? 'Unknown',
        metricValue: activity.metricValue,
        metricUnit: activity.metricUnit,
        status: activity.isCompleted === 1 ? 'Completed' : 'Not completed',
        notes: activity.notes ?? '',
      }));

      const packingRows = packingItems.map((item) => ({
        id: item.id,
        title: item.title,
        checked: item.isChecked === 1 ? 'Yes' : 'No',
      }));

      await exportTripDataToCsv(trip.name, [
        {
          title: 'Activities',
          rows: activityRows,
        },
        {
          title: 'Packing List',
          rows: packingRows,
        },
      ]);

      Alert.alert('Success', 'Trip data exported successfully.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to export CSV.';
      Alert.alert('Export Error', message);
    }
  }

  // Delete whole trip
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

  // Delete activity
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

  // Delete target
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
    if (status === 'Exceeded') return palette.danger;
    if (status === 'Met') return palette.success;
    return palette.subtext;
  }

  function getTripBadgeColors(status: string) {
    if (status === 'Upcoming') {
      return {
        backgroundColor: palette.blueSoft,
        textColor: palette.blueText,
      };
    }

    if (status === 'In Progress') {
      return {
        backgroundColor: palette.yellowSoft,
        textColor: palette.yellowText,
      };
    }

    return {
      backgroundColor: palette.graySoft,
      textColor: palette.grayText,
    };
  }

  // Activity card
  function renderActivityItem({ item }: { item: Activity }) {
    return (
      <View
        style={[
          styles.activityCard,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <Pressable onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}>
          <Text style={[styles.activityTitle, { color: palette.text }]}>{item.title}</Text>

          <Text style={[styles.activityMeta, { color: palette.subtext }]}>
            {formatDisplayDate(item.date)} • {item.metricValue} {item.metricUnit}
          </Text>

          <Text style={[styles.activityMeta, { color: palette.subtext }]}>
            Category: {categoryMap[item.categoryId] ?? 'Unknown'}
          </Text>

          <Text style={[styles.activityMeta, { color: palette.subtext }]}>
            Status: {item.isCompleted === 1 ? 'Completed' : 'Not completed'}
          </Text>

          {item.notes ? (
            <Text style={[styles.activityNotes, { color: palette.subtext }]}>{item.notes}</Text>
          ) : null}
        </Pressable>

        <View style={styles.rowButtons}>
          <Pressable
            style={[
              styles.secondaryButtonHalf,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
            onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}
          >
            <Text style={[styles.secondaryButtonHalfText, { color: palette.text }]}>Edit</Text>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButtonHalf,
              { backgroundColor: palette.dangerSoft, borderColor: palette.dangerBorder },
            ]}
            onPress={() => handleDeleteActivity(item.id, item.title)}
          >
            <Text style={[styles.secondaryButtonHalfText, { color: palette.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Target card
  function renderTargetItem({ item }: { item: TripTargetWithProgress }) {
    return (
      <View
        style={[
          styles.targetCard,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.targetTitle, { color: palette.text }]}>{item.title}</Text>

        <Text style={[styles.targetMeta, { color: palette.subtext }]}>
          Category: {item.categoryId ? categoryMap[item.categoryId] ?? 'Unknown' : 'All categories'}
        </Text>

        <Text style={[styles.targetMeta, { color: palette.subtext }]}>Goal: {item.goal} mins</Text>
        <Text style={[styles.targetMeta, { color: palette.subtext }]}>Current: {item.current} mins</Text>
        <Text style={[styles.targetMeta, { color: palette.subtext }]}>
          Remaining: {item.remaining} mins
        </Text>

        <Text style={[styles.targetStatus, { color: getStatusColor(item.status) }]}>
          Status: {item.status}
        </Text>

        <View style={styles.rowButtons}>
          <Pressable
            style={[
              styles.secondaryButtonHalf,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
            onPress={() => navigation.navigate('EditTarget', { targetId: item.id })}
          >
            <Text style={[styles.secondaryButtonHalfText, { color: palette.text }]}>Edit</Text>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButtonHalf,
              { backgroundColor: palette.dangerSoft, borderColor: palette.dangerBorder },
            ]}
            onPress={() => handleDeleteTarget(item.id, item.title)}
          >
            <Text style={[styles.secondaryButtonHalfText, { color: palette.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading || !trip) {
    return (
      <ScreenContainer>
        <View style={[styles.loadingWrap, { backgroundColor: palette.page }]}>
          <Text style={{ color: palette.text }}>Loading trip details...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const tripStatus = getTripStatus(trip.startDate, trip.endDate);
  const tripCountdown = getTripCountdown(trip.startDate, trip.endDate);
  const tripBadge = getTripBadgeColors(tripStatus);

  return (
    <ScreenContainer>
      <View style={[styles.page, { backgroundColor: palette.page }]}>
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => `activity-${item.id}`}
          renderItem={renderActivityItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Hero section */}
              <View
                style={[
                  styles.heroCard,
                  {
                    backgroundColor: palette.hero,
                    borderColor: palette.heroBorder,
                  },
                ]}
              >
                <View style={styles.heroTopRow}>
                  <Pressable onPress={() => navigation.goBack()}>
                    <Text style={[styles.backText, { color: '#D7DEE8' }]}>‹ My Trips</Text>
                  </Pressable>

                  <View
                    style={[
                      styles.heroStatusBadge,
                      { backgroundColor: tripBadge.backgroundColor },
                    ]}
                  >
                    <Text style={[styles.heroStatusBadgeText, { color: tripBadge.textColor }]}>
                      {tripStatus}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.heroTitle, { color: '#F8F5EF' }]}>{trip.name}</Text>
                <Text style={[styles.heroDestination, { color: '#D7DEE8' }]}>{trip.destination}</Text>

                <Text style={[styles.heroDates, { color: '#D7DEE8' }]}>
                  {formatDisplayDate(trip.startDate)} → {formatDisplayDate(trip.endDate)}
                </Text>

                <Text style={[styles.heroCountdown, { color: '#F7D774' }]}>{tripCountdown}</Text>

                {trip.notes ? (
                  <Text style={[styles.heroNotes, { color: '#D7DEE8' }]}>{trip.notes}</Text>
                ) : null}
              </View>

              {/* Main trip buttons */}
              <View style={styles.actionsGrid}>
                <Pressable
                  style={[styles.primaryActionButton, { backgroundColor: palette.primary }]}
                  onPress={() => navigation.navigate('AddActivity', { tripId: trip.id })}
                >
                  <Text style={[styles.primaryActionText, { color: palette.primaryText }]}>
                    + Add Activity
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.primaryActionButton, { backgroundColor: palette.hero }]}
                  onPress={() => navigation.navigate('AddTarget', { tripId: trip.id })}
                >
                  <Text style={[styles.primaryActionText, { color: '#FFFFFF' }]}>
                    + Add Target
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.secondaryActionButton,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                  ]}
                  onPress={() => navigation.navigate('EditTrip', { tripId: trip.id })}
                >
                  <Text style={[styles.secondaryActionText, { color: palette.text }]}>Edit Trip</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.secondaryActionButton,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                  ]}
                  onPress={handleExportCsv}
                >
                  <Text style={[styles.secondaryActionText, { color: palette.text }]}>Export CSV</Text>
                </Pressable>
              </View>

              <Pressable
                style={[
                  styles.deleteTripButton,
                  { backgroundColor: palette.dangerSoft, borderColor: palette.dangerBorder },
                ]}
                onPress={handleDeleteTrip}
              >
                <Text style={[styles.deleteTripButtonText, { color: palette.danger }]}>
                  Delete Trip
                </Text>
              </Pressable>

              {/* Packing list section */}
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Packing List</Text>

              <View
                style={[
                  styles.sectionCard,
                  { backgroundColor: palette.card, borderColor: palette.border },
                ]}
              >
                <View style={styles.packingInputRow}>
                  <TextInput
                    style={[
                      styles.packingInput,
                      {
                        backgroundColor: palette.input,
                        borderColor: palette.border,
                        color: palette.text,
                      },
                    ]}
                    placeholder="Add packing item"
                    placeholderTextColor={palette.placeholder}
                    value={newPackingItem}
                    onChangeText={setNewPackingItem}
                  />

                  <Pressable
                    style={[styles.addPackingButton, { backgroundColor: palette.primary }]}
                    onPress={handleAddPackingItem}
                  >
                    <Text style={[styles.addPackingButtonText, { color: palette.primaryText }]}>
                      Add
                    </Text>
                  </Pressable>
                </View>

                {packingItems.length === 0 ? (
                  <View
                    style={[
                      styles.packingEmptyState,
                      { borderColor: palette.border, backgroundColor: palette.surface },
                    ]}
                  >
                    <Text style={[styles.packingEmptyTitle, { color: palette.subtext }]}>
                      Nothing packed yet.
                    </Text>
                    <Text style={[styles.packingEmptyText, { color: palette.subtext }]}>
                      Start adding items for this trip.
                    </Text>
                  </View>
                ) : (
                  packingItems.map((item) => (
                    <View
                      key={item.id}
                      style={[styles.packingItemRow, { borderTopColor: palette.border }]}
                    >
                      <Pressable
                        style={styles.packingLeft}
                        onPress={() => handleTogglePackingItem(item)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: item.isChecked === 1 ? palette.primary : palette.border,
                              backgroundColor: item.isChecked === 1 ? palette.primary : 'transparent',
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
                              color: palette.text,
                              textDecorationLine: item.isChecked === 1 ? 'line-through' : 'none',
                              opacity: item.isChecked === 1 ? 0.7 : 1,
                            },
                          ]}
                        >
                          {item.title}
                        </Text>
                      </Pressable>

                      <Pressable onPress={() => handleDeletePackingItem(item)}>
                        <Text style={[styles.deletePackingText, { color: palette.danger }]}>
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>

              {/* Activities section */}
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Activities</Text>

              <View
                style={[
                  styles.sectionCard,
                  { backgroundColor: palette.card, borderColor: palette.border },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: palette.input,
                      borderColor: palette.border,
                      color: palette.text,
                    },
                  ]}
                  placeholder="Search activities"
                  placeholderTextColor={palette.placeholder}
                  value={searchText}
                  onChangeText={setSearchText}
                  accessibilityLabel="Search trip activities input"
                />

                {/* date range filters */}
                <Text style={[styles.filterLabel, { color: palette.subtext }]}>Date Range</Text>

                <View style={styles.dateFilterRow}>
                  <TextInput
                    style={[
                      styles.dateInput,
                      {
                        backgroundColor: palette.input,
                        borderColor: palette.border,
                        color: palette.text,
                      },
                    ]}
                    placeholder="Start date"
                    placeholderTextColor={palette.placeholder}
                    value={startDateFilter}
                    onChangeText={setStartDateFilter}
                    accessibilityLabel="Start date filter input"
                  />

                  <TextInput
                    style={[
                      styles.dateInput,
                      {
                        backgroundColor: palette.input,
                        borderColor: palette.border,
                        color: palette.text,
                      },
                    ]}
                    placeholder="End date"
                    placeholderTextColor={palette.placeholder}
                    value={endDateFilter}
                    onChangeText={setEndDateFilter}
                    accessibilityLabel="End date filter input"
                  />
                </View>

                <Text style={[styles.dateHint, { color: palette.subtext }]}>
                  Enter dates as DD-MM-YYYY
                </Text>

                <Text style={[styles.filterLabel, { color: palette.subtext }]}>Category</Text>

                <View style={styles.filterChipsRow}>
                  <Pressable
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selectedCategoryId === null ? palette.chipActive : palette.chip,
                        borderColor: selectedCategoryId === null ? palette.chipActive : palette.border,
                      },
                    ]}
                    onPress={() => setSelectedCategoryId(null)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color:
                            selectedCategoryId === null
                              ? palette.chipTextActive
                              : palette.chipText,
                        },
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
                          backgroundColor:
                            selectedCategoryId === category.id
                              ? palette.chipActive
                              : palette.chip,
                          borderColor:
                            selectedCategoryId === category.id
                              ? palette.chipActive
                              : palette.border,
                        },
                      ]}
                      onPress={() => setSelectedCategoryId(category.id)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color:
                              selectedCategoryId === category.id
                                ? palette.chipTextActive
                                : palette.chipText,
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.filterLabel, { color: palette.subtext }]}>Status</Text>

                <View style={styles.filterChipsRow}>
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Not Completed', value: 'not_completed' },
                  ].map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor:
                            statusFilter === option.value ? palette.chipActive : palette.chip,
                          borderColor:
                            statusFilter === option.value ? palette.chipActive : palette.border,
                        },
                      ]}
                      onPress={() =>
                        setStatusFilter(option.value as 'all' | 'completed' | 'not_completed')
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color:
                              statusFilter === option.value
                                ? palette.chipTextActive
                                : palette.chipText,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable style={styles.clearFiltersButton} onPress={clearActivityFilters}>
                  <Text style={[styles.clearFiltersText, { color: palette.primary }]}>
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
                { backgroundColor: palette.card, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: palette.text }]}>No matching activities</Text>
              <Text style={[styles.emptyText, { color: palette.subtext }]}>
                Try changing the filters or add a new activity.
              </Text>
            </View>
          }
          ListFooterComponent={
            <>
              {/* Targets section */}
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Targets</Text>

              {targets.length === 0 ? (
                <View
                  style={[
                    styles.emptyState,
                    { backgroundColor: palette.card, borderColor: palette.border },
                  ]}
                >
                  <Text style={[styles.emptyTitle, { color: palette.text }]}>No targets yet</Text>
                  <Text style={[styles.emptyText, { color: palette.subtext }]}>
                    Add a target to track this trip more clearly.
                  </Text>
                </View>
              ) : (
                targets.map((target) => (
                  <View key={`target-${target.id}`}>
                    {renderTargetItem({ item: target })}
                  </View>
                ))
              )}

              {/* Insights section */}
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Insights</Text>

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
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 28,
  },

  // Hero section
  heroCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  heroStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroStatusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroDestination: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 6,
  },
  heroDates: {
    fontSize: 15,
    marginBottom: 6,
  },
  heroCountdown: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroNotes: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Button grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  primaryActionButton: {
    width: '48.5%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActionButton: {
    width: '48.5%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteTripButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  deleteTripButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Section titles
  sectionTitle: {
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },

  // Packing list
  packingInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  packingInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  addPackingButton: {
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPackingButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  packingEmptyState: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  packingEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  packingEmptyText: {
    fontSize: 15,
  },
  packingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
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

  // Filter block
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  dateHint: {
    fontSize: 13,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  clearFiltersText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Activity card
  activityCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  activityTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityNotes: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },

  // Target card
  targetCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  targetTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  targetMeta: {
    fontSize: 14,
    marginBottom: 4,
  },
  targetStatus: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },

  // Small button row
  rowButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButtonHalf: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonHalfText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Empty states
  emptyState: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
  },
});