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
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
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

export default function Trips({ navigation }: any) {
  const { themeMode } = useTheme();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('nearest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // colour palette
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
        upcomingBar: '#3B82F6',
        upcomingBadgeBg: '#1E3A5F',
        upcomingBadgeText: '#93C5FD',
        progressBar: '#D4A853',
        progressBadgeBg: '#4A3E18',
        progressBadgeText: '#F7D774',
        completedBar: '#94A3B8',
        completedBadgeBg: '#334155',
        completedBadgeText: '#E2E8F0',
        tabBg: '#13233A',
        tabActive: '#D4A853',
        tabInactive: '#AAB7C8',
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
        upcomingBar: '#2563EB',
        upcomingBadgeBg: '#DBEAFE',
        upcomingBadgeText: '#1D4ED8',
        progressBar: '#D4A853',
        progressBadgeBg: '#FEF3C7',
        progressBadgeText: '#92400E',
        completedBar: '#9CA3AF',
        completedBadgeBg: '#E5E7EB',
        completedBadgeText: '#374151',
        tabBg: '#FFFFFF',
        tabActive: '#C4622D',
        tabInactive: '#7A7A7A',
      };

  // Load trips when the screen is opened again
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

  // Sorting is kept here so the UI code stays readable
  const sortedTrips = useMemo(() => {
    const sorted = [...trips];

    if (sortBy === 'nearest') {
      sorted.sort(
        (a, b) => parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime()
      );
    }

    if (sortBy === 'furthest') {
      sorted.sort(
        (a, b) => parseDate(b.startDate).getTime() - parseDate(a.startDate).getTime()
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

  // Current + future trips
  const upcomingTrips = useMemo(() => {
    return sortedTrips.filter((trip) => {
      const status = getTripStatus(trip.startDate, trip.endDate);
      return status === 'Upcoming' || status === 'In Progress';
    });
  }, [sortedTrips]);

  // Finished trips
  const pastTrips = useMemo(() => {
    return sortedTrips.filter((trip) => {
      const status = getTripStatus(trip.startDate, trip.endDate);
      return status === 'Completed';
    });
  }, [sortedTrips]);

  function getTripVisuals(status: string) {
    if (status === 'Upcoming') {
      return {
        topBar: palette.upcomingBar,
        badgeBg: palette.upcomingBadgeBg,
        badgeText: palette.upcomingBadgeText,
      };
    }

    if (status === 'In Progress') {
      return {
        topBar: palette.progressBar,
        badgeBg: palette.progressBadgeBg,
        badgeText: palette.progressBadgeText,
      };
    }

    return {
      topBar: palette.completedBar,
      badgeBg: palette.completedBadgeBg,
      badgeText: palette.completedBadgeText,
    };
  }

  function renderTripCard(item: Trip) {
    const status = getTripStatus(item.startDate, item.endDate);
    const countdown = getTripCountdown(item.startDate, item.endDate);
    const visuals = getTripVisuals(status);

    return (
      <Pressable
        key={item.id}
        style={[
          styles.tripCard,
          {
            backgroundColor: palette.card,
            borderColor: palette.border,
          },
        ]}
        onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
        accessibilityLabel={`Open trip ${item.name}`}
      >
        <View style={[styles.tripBar, { backgroundColor: visuals.topBar }]} />

        <View style={styles.tripBody}>
          <View style={styles.tripHeaderRow}>
            <View style={styles.tripTitleWrap}>
              <Text style={[styles.tripTitle, { color: palette.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.tripDestination, { color: palette.subtext }]} numberOfLines={1}>
                {item.destination}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: visuals.badgeBg }]}>
              <Text style={[styles.statusBadgeText, { color: visuals.badgeText }]}>
                {status}
              </Text>
            </View>
          </View>

          <Text style={[styles.tripDate, { color: palette.subtext }]}>
            {formatDate(item.startDate)} → {formatDate(item.endDate)}
          </Text>

          <Text style={[styles.tripCountdown, { color: palette.upcomingBar }]}>
            {countdown}
          </Text>

          {item.notes ? (
            <Text style={[styles.tripNotes, { color: palette.subtext }]} numberOfLines={2}>
              {item.notes}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <ScreenContainer>
      <View style={[styles.page, { backgroundColor: palette.page }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top branding block */}
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
              <View
                style={[
                  styles.logoBox,
                  {
                    borderColor: themeMode === 'dark' ? '#315074' : '#2D415A',
                    backgroundColor: themeMode === 'dark' ? '#1A3452' : '#22364D',
                  },
                ]}
              >
                <Text style={styles.logoBoxText}>Logo</Text>
              </View>

              <View style={styles.brandBlock}>
                <Text style={[styles.brandName, { color: '#F8F5EF' }]}>Wanderly</Text>
                <Text style={[styles.brandTagline, { color: '#D7DEE8' }]}>
                  Plan. Pack. Explore.
                </Text>
              </View>
            </View>

            <Text style={[styles.screenHeading, { color: '#F8F5EF' }]}>My Trips</Text>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#FBF8F3', borderColor: '#D9D2C7' }]}>
                <Text style={[styles.statValue, { color: '#18212B' }]}>{upcomingTrips.length}</Text>
                <Text style={[styles.statLabel, { color: '#6B7280' }]}>Upcoming</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#FBF8F3', borderColor: '#D9D2C7' }]}>
                <Text style={[styles.statValue, { color: '#18212B' }]}>{pastTrips.length}</Text>
                <Text style={[styles.statLabel, { color: '#6B7280' }]}>Past trips</Text>
              </View>
            </View>
          </View>

          {/* Main trip action */}
          <Pressable
            style={[styles.addTripButton, { backgroundColor: palette.primary }]}
            onPress={() => navigation.navigate('AddTrip')}
            accessibilityLabel="Add a new trip"
          >
            <Text style={[styles.addTripButtonText, { color: palette.primaryText }]}>
              + Add Trip
            </Text>
          </Pressable>

          {/* Small controls */}
          <View style={styles.controlsRow}>
            <Pressable
              style={[
                styles.sortButton,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
              onPress={() => setShowSortMenu(true)}
              accessibilityLabel="Open sort trips menu"
            >
              <Text style={[styles.controlLabel, { color: palette.subtext }]}>Sort</Text>
              <Text style={[styles.controlValue, { color: palette.text }]}>
                {getSortLabel()} ▾
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.categoriesButton,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
              onPress={() => navigation.navigate('Categories')}
              accessibilityLabel="Open categories screen"
            >
              <Text style={[styles.categoriesButtonText, { color: palette.text }]}>
                Categories
              </Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Upcoming Trips</Text>
            <Text style={[styles.sectionCount, { color: palette.subtext }]}>
              {upcomingTrips.length}
            </Text>
          </View>

          {upcomingTrips.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: palette.card, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: palette.text }]}>No upcoming trips</Text>
              <Text style={[styles.emptyText, { color: palette.subtext }]}>
                Add a trip to start planning your next one.
              </Text>
            </View>
          ) : (
            upcomingTrips.map(renderTripCard)
          )}

          <View style={[styles.sectionHeader, styles.sectionSpacing]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Past Trips</Text>
            <Text style={[styles.sectionCount, { color: palette.subtext }]}>
              {pastTrips.length}
            </Text>
          </View>

          {pastTrips.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: palette.card, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: palette.text }]}>No past trips</Text>
              <Text style={[styles.emptyText, { color: palette.subtext }]}>
                Completed trips will show here after they finish.
              </Text>
            </View>
          ) : (
            pastTrips.map(renderTripCard)
          )}
        </ScrollView>

        {/* Bottom nav stays outside the scroll */}
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: palette.tabBg,
              borderColor: palette.border,
            },
          ]}
        >
          <Pressable
            style={styles.tabItem}
            onPress={() => navigation.navigate('Trips')}
            accessibilityLabel="Trips tab"
          >
            <Text style={[styles.tabDot, { color: palette.tabActive }]}>●</Text>
            <Text style={[styles.tabTextActive, { color: palette.tabActive }]}>Trips</Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => navigation.navigate('Insights')}
            accessibilityLabel="Insights tab"
          >
            <Text style={[styles.tabDot, { color: palette.tabInactive }]}>●</Text>
            <Text style={[styles.tabText, { color: palette.tabInactive }]}>Insights</Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Profile tab"
          >
            <Text style={[styles.tabDot, { color: palette.tabInactive }]}>●</Text>
            <Text style={[styles.tabText, { color: palette.tabInactive }]}>Profile</Text>
          </Pressable>
        </View>

        <Modal
          visible={showSortMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSortMenu(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowSortMenu(false)}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: palette.text }]}>Sort Trips</Text>

              <Pressable
                style={[styles.optionButton, { borderTopColor: palette.border }]}
                onPress={() => chooseSort('nearest')}
              >
                <Text style={[styles.optionText, { color: palette.text }]}>Nearest Trip</Text>
              </Pressable>

              <Pressable
                style={[styles.optionButton, { borderTopColor: palette.border }]}
                onPress={() => chooseSort('furthest')}
              >
                <Text style={[styles.optionText, { color: palette.text }]}>Furthest Trip</Text>
              </Pressable>

              <Pressable
                style={[styles.optionButton, { borderTopColor: palette.border }]}
                onPress={() => chooseSort('recent')}
              >
                <Text style={[styles.optionText, { color: palette.text }]}>Recently Added</Text>
              </Pressable>

              <Pressable
                style={[styles.optionButton, { borderTopColor: palette.border }]}
                onPress={() => chooseSort('az')}
              >
                <Text style={[styles.optionText, { color: palette.text }]}>A-Z</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },

  // Extra bottom padding so the last card doesn't get hidden behind the tab bar
  scrollContent: {
    paddingBottom: 110,
  },

  heroCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  logoBox: {
    width: 92,
    height: 92,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBoxText: {
    color: '#E5E7EB',
    fontSize: 17,
    fontWeight: '600',
  },
  brandBlock: {
    flex: 1,
  },
  brandName: {
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 16,
    fontWeight: '500',
  },
  screenHeading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '500',
  },

  addTripButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  addTripButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },

  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  sortButton: {
    flex: 1.2,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  categoriesButton: {
    flex: 0.9,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  controlLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  controlValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoriesButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionSpacing: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  sectionCount: {
    fontSize: 15,
    fontWeight: '700',
  },

  tripCard: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  tripBar: {
    height: 8,
    width: '100%',
  },
  tripBody: {
    padding: 16,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  tripTitleWrap: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 4,
  },
  tripDestination: {
    fontSize: 16,
    marginBottom: 4,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tripDate: {
    fontSize: 15,
    marginBottom: 6,
  },
  tripCountdown: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  tripNotes: {
    fontSize: 14,
    lineHeight: 20,
  },

  emptyCard: {
    borderRadius: 12,
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
    lineHeight: 22,
  },

  // under the scroll layout so it stays fixed
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabDot: {
    fontSize: 10,
    lineHeight: 14,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
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