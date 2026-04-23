import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import { useTheme } from '../theme/ThemeContext';
import { getCurrentUserId } from '../utils/authStorage';
import { getTripsByUserId } from '../utils/trips';

type SortOption = 'nearest' | 'furthest' | 'recent' | 'az';

type Trip = {
  id: number;
  userId: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
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

function formatDate(value: string) {
  const date = parseDate(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function differenceInDays(from: Date, to: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
}

function getTripStatus(startDate: string, endDate: string) {
  const today = startOfDay(new Date());
  const start = startOfDay(parseDate(startDate));
  const end = startOfDay(parseDate(endDate));

  if (today < start) {
    return 'Upcoming';
  }

  if (today > end) {
    return 'Completed';
  }

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

export default function Trips({ navigation }: any) {
  const { colors, themeMode } = useTheme();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('nearest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const loadTrips = useCallback(async () => {
    const userId = await getCurrentUserId();

    if (!userId) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }

    const rows = await getTripsByUserId(userId);
    setTrips(rows);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  function getSortLabel() {
    if (sortBy === 'nearest') return 'Nearest Trip';
    if (sortBy === 'furthest') return 'Furthest Trip';
    if (sortBy === 'recent') return 'Recently Added';
    return 'A-Z';
  }

  function chooseSort(option: SortOption) {
    setSortBy(option);
    setShowSortMenu(false);
  }

  const sortedTrips = useMemo(() => {
    const sorted = [...trips];

    if (sortBy === 'nearest') {
      sorted.sort(
        (a, b) =>
          parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime()
      );
    }

    if (sortBy === 'furthest') {
      sorted.sort(
        (a, b) =>
          parseDate(b.startDate).getTime() - parseDate(a.startDate).getTime()
      );
    }

    if (sortBy === 'recent') {
      sorted.sort((a, b) => b.id - a.id);
    }

    if (sortBy === 'az') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [trips, sortBy]);

  const upcomingTrips = useMemo(() => {
    return sortedTrips.filter((trip) => {
      const status = getTripStatus(trip.startDate, trip.endDate);
      return status === 'Upcoming' || status === 'In Progress';
    });
  }, [sortedTrips]);

  const pastTrips = useMemo(() => {
    return sortedTrips.filter((trip) => {
      const status = getTripStatus(trip.startDate, trip.endDate);
      return status === 'Completed';
    });
  }, [sortedTrips]);

  function renderTripCard(item: Trip) {
    const status = getTripStatus(item.startDate, item.endDate);
    const countdown = getTripCountdown(item.startDate, item.endDate);

    const badgeBackground =
      status === 'Upcoming'
        ? themeMode === 'dark'
          ? '#1e3a5f'
          : '#dbeafe'
        : status === 'In Progress'
        ? themeMode === 'dark'
          ? '#3f3a16'
          : '#fef3c7'
        : themeMode === 'dark'
        ? '#1f2937'
        : '#e5e7eb';

    const badgeText =
      status === 'Upcoming'
        ? themeMode === 'dark'
          ? '#93c5fd'
          : '#1d4ed8'
        : status === 'In Progress'
        ? themeMode === 'dark'
          ? '#fde68a'
          : '#92400e'
        : themeMode === 'dark'
        ? '#d1d5db'
        : '#374151';

    return (
      <Pressable
        key={item.id}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() =>
          navigation.navigate('TripDetails', {
            tripId: item.id,
          })
        }
      >
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>

          <View style={[styles.statusBadge, { backgroundColor: badgeBackground }]}>
            <Text style={[styles.statusBadgeText, { color: badgeText }]}>{status}</Text>
          </View>
        </View>

        <Text style={[styles.destination, { color: colors.subtext }]}>
          {item.destination}
        </Text>

        <Text style={[styles.dateText, { color: colors.subtext }]}>
          {formatDate(item.startDate)} → {formatDate(item.endDate)}
        </Text>

        <Text style={[styles.countdownText, { color: colors.accent }]}>
          {countdown}
        </Text>

        {item.notes ? (
          <Text style={[styles.notes, { color: colors.subtext }]} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}
      </Pressable>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>My Trips</Text>

        <Pressable
          style={[
            styles.addButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={() => navigation.navigate('AddTrip')}
        >
          <Text style={[styles.addButtonText, { color: colors.primaryText }]}>
            + Add Trip
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={[
          styles.sortButton,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => setShowSortMenu(true)}
      >
        <Text style={[styles.sortButtonLabel, { color: colors.subtext }]}>Sort by</Text>
        <Text style={[styles.sortButtonValue, { color: colors.text }]}>
          {getSortLabel()} ▾
        </Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Trips</Text>

        {upcomingTrips.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No upcoming trips</Text>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Your future and current trips will appear here.
            </Text>
          </View>
        ) : (
          upcomingTrips.map(renderTripCard)
        )}

        <Text style={[styles.sectionTitle, styles.pastTripsTitle, { color: colors.text }]}>
          Past Trips
        </Text>

        {pastTrips.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No past trips</Text>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Completed trips will appear here.
            </Text>
          </View>
        ) : (
          pastTrips.map(renderTripCard)
        )}
      </ScrollView>

      <View style={styles.footerMenu}>
        <Pressable
          style={[
            styles.menuButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => navigation.navigate('Categories')}
        >
          <Text style={[styles.menuText, { color: colors.text }]}>Categories</Text>
        </Pressable>

        <Pressable
          style={[
            styles.menuButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => navigation.navigate('Insights')}
        >
          <Text style={[styles.menuText, { color: colors.text }]}>Insights</Text>
        </Pressable>

        <Pressable
          style={[
            styles.menuButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={[styles.menuText, { color: colors.text }]}>Profile</Text>
        </Pressable>
      </View>

      <Modal
        visible={showSortMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortMenu(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sort Trips</Text>

            <Pressable
              style={[styles.optionButton, { borderTopColor: colors.border }]}
              onPress={() => chooseSort('nearest')}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>Nearest Trip</Text>
            </Pressable>

            <Pressable
              style={[styles.optionButton, { borderTopColor: colors.border }]}
              onPress={() => chooseSort('furthest')}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>Furthest Trip</Text>
            </Pressable>

            <Pressable
              style={[styles.optionButton, { borderTopColor: colors.border }]}
              onPress={() => chooseSort('recent')}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>Recently Added</Text>
            </Pressable>

            <Pressable
              style={[styles.optionButton, { borderTopColor: colors.border }]}
              onPress={() => chooseSort('az')}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>A-Z</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    fontWeight: '600',
  },
  sortButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  sortButtonLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  sortButtonValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  pastTripsTitle: {
    marginTop: 10,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  destination: {
    fontSize: 16,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 15,
    marginBottom: 6,
  },
  countdownText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  notes: {
    fontSize: 14,
  },
  emptyCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
  },
  footerMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },
  menuButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  menuText: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
});