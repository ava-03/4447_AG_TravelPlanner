import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

import ScreenContainer from '../components/ScreenContainer';
import { useTheme } from '../theme/ThemeContext';
import { getCurrentUserId } from '../utils/authStorage';
import { getActivitiesByUserId, getCategoriesForUser } from '../utils/activities';
import { getTripsByUserId } from '../utils/trips';

type InsightRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

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

type Category = {
  id: number;
  userId: number;
  name: string;
  color: string;
  icon: string;
};

type Trip = {
  id: number;
  userId: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
};

const screenWidth = Dimensions.get('window').width;

function parseDate(value: string) {
  const parts = value.split('-');

  if (parts[0]?.length === 4) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
}

function isSameDay(date: Date, base: Date) {
  return (
    date.getFullYear() === base.getFullYear() &&
    date.getMonth() === base.getMonth() &&
    date.getDate() === base.getDate()
  );
}

function getWeekBounds(base: Date) {
  const temp = new Date(base);
  const day = temp.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(temp);
  start.setDate(temp.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function isSameWeek(date: Date, base: Date) {
  const { start, end } = getWeekBounds(base);
  return date >= start && date <= end;
}

function isSameMonth(date: Date, base: Date) {
  return (
    date.getFullYear() === base.getFullYear() &&
    date.getMonth() === base.getMonth()
  );
}

function isSameYear(date: Date, base: Date) {
  return date.getFullYear() === base.getFullYear();
}

function matchesRange(date: Date, base: Date, range: InsightRange) {
  if (range === 'daily') return isSameDay(date, base);
  if (range === 'weekly') return isSameWeek(date, base);
  if (range === 'monthly') return isSameMonth(date, base);
  return isSameYear(date, base);
}

export default function Insights({ navigation }: any) {
  const { themeMode } = useTheme();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [range, setRange] = useState<InsightRange>('monthly');
  const [loading, setLoading] = useState(true);

  // screen palette
  const palette =
    themeMode === 'dark'
      ? {
          page: '#0F172A',
          hero: '#132A46',
          heroBorder: '#1F3D63',
          card: '#17263D',
          border: '#28405F',
          text: '#F8FAFC',
          subtext: '#C7D2E0',
          accent: '#D4A853',
          chip: '#111C2D',
          chipActive: '#C4622D',
          chipText: '#C7D2E0',
          chipTextActive: '#FFFFFF',
          tabBg: '#13233A',
          tabActive: '#D4A853',
          tabInactive: '#AAB7C8',
          chartBar: 'rgba(212, 168, 83, 1)',
          chartLabel: 'rgba(248, 250, 252, 1)',
          statBg: '#111C2D',
        }
      : {
          page: '#F5F0E8',
          hero: '#1A2E44',
          heroBorder: '#1A2E44',
          card: '#FFFFFF',
          border: '#DDD6CA',
          text: '#18212B',
          subtext: '#6B7280',
          accent: '#C4622D',
          chip: '#FFFFFF',
          chipActive: '#C4622D',
          chipText: '#4B5563',
          chipTextActive: '#FFFFFF',
          tabBg: '#FFFFFF',
          tabActive: '#C4622D',
          tabInactive: '#7A7A7A',
          chartBar: 'rgba(196, 98, 45, 1)',
          chartLabel: 'rgba(24, 33, 43, 1)',
          statBg: '#FBF8F3',
        };

  // load insights data
  const loadInsights = useCallback(async () => {
    const userId = await getCurrentUserId();

    if (!userId) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }

    const [userActivities, userCategories, userTrips] = await Promise.all([
      getActivitiesByUserId(userId),
      getCategoriesForUser(userId),
      getTripsByUserId(userId),
    ]);

    setActivities(userActivities);
    setCategories(userCategories);
    setTrips(userTrips);
    setLoading(false);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [loadInsights])
  );

  // main summary calculations
  const summary = useMemo(() => {
    const now = new Date();

    const filteredTrips = trips.filter((trip) =>
      matchesRange(parseDate(trip.startDate), now, range)
    );

    const totalTrips = filteredTrips.length;
    const completedTrips = filteredTrips.filter((trip) => parseDate(trip.endDate) < now).length;
    const upcomingTrips = filteredTrips.filter((trip) => parseDate(trip.startDate) > now).length;
    const activeTrips = filteredTrips.filter((trip) => {
      const start = parseDate(trip.startDate);
      const end = parseDate(trip.endDate);
      return now >= start && now <= end;
    }).length;

    const filteredActivities = activities.filter((activity) =>
      matchesRange(parseDate(activity.date), now, range)
    );

    const totalActivities = filteredActivities.length;
    const totalMinutes = filteredActivities
      .filter((activity) => activity.metricUnit === 'minutes')
      .reduce((sum, activity) => sum + activity.metricValue, 0);

    const completedActivities = filteredActivities.filter(
      (activity) => activity.isCompleted === 1
    ).length;

    const categoryMap = Object.fromEntries(
      categories.map((category) => [category.id, category.name])
    ) as Record<number, string>;

    const minutesByCategoryMap: Record<string, number> = {};

    filteredActivities
      .filter((activity) => activity.metricUnit === 'minutes')
      .forEach((activity) => {
        const categoryName = categoryMap[activity.categoryId] ?? 'Unknown';
        if (!minutesByCategoryMap[categoryName]) {
          minutesByCategoryMap[categoryName] = 0;
        }
        minutesByCategoryMap[categoryName] += activity.metricValue;
      });

    const minutesByCategory = Object.entries(minutesByCategoryMap)
      .map(([name, minutes]) => ({
        name,
        minutes,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    let topCategory = 'None';
    if (minutesByCategory.length > 0) {
      topCategory = minutesByCategory[0].name;
    }

    return {
      totalTrips,
      completedTrips,
      upcomingTrips,
      activeTrips,
      totalActivities,
      totalMinutes,
      completedActivities,
      topCategory,
      minutesByCategory,
    };
  }, [activities, categories, trips, range]);

  // keep chart labels short
  const chartLabels = summary.minutesByCategory.map((item) =>
    item.name.length > 8 ? item.name.slice(0, 8) : item.name
  );

  const chartValues = summary.minutesByCategory.map((item) => item.minutes);

  function getRangeTitle() {
    if (range === 'daily') return 'Today';
    if (range === 'weekly') return 'This Week';
    if (range === 'monthly') return 'This Month';
    return 'This Year';
  }

  return (
    <ScreenContainer>
      <View style={[styles.page, { backgroundColor: palette.page }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* top heading block */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: palette.hero,
                borderColor: palette.heroBorder,
              },
            ]}
          >
            <Text style={styles.heroTitle}>Overall Insights</Text>

            <Text style={styles.heroSubtitle}>
              View your trip and activity summaries across different time ranges.
            </Text>
          </View>

          {/* range filter block */}
          <View
            style={[
              styles.filterCard,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.filterLabel, { color: palette.subtext }]}>Time Range</Text>

            <View style={styles.rangeRow}>
              {(['daily', 'weekly', 'monthly', 'yearly'] as InsightRange[]).map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.rangeChip,
                    {
                      backgroundColor: range === item ? palette.chipActive : palette.chip,
                      borderColor: range === item ? palette.chipActive : palette.border,
                    },
                  ]}
                  onPress={() => setRange(item)}
                >
                  <Text
                    style={[
                      styles.rangeChipText,
                      {
                        color: range === item ? palette.chipTextActive : palette.chipText,
                      },
                    ]}
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {loading ? (
            <Text style={[styles.loadingText, { color: palette.subtext }]}>
              Loading insights...
            </Text>
          ) : (
            <>
              {/* section title */}
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                {getRangeTitle()}
              </Text>

              {/* trips summary */}
              <Text style={[styles.subheading, { color: palette.text }]}>Trips</Text>

              <View style={styles.statsGrid}>
                {[
                  { value: summary.totalTrips, label: 'Total Trips' },
                  { value: summary.completedTrips, label: 'Completed Trips' },
                  { value: summary.activeTrips, label: 'Active Trips' },
                  { value: summary.upcomingTrips, label: 'Upcoming Trips' },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: palette.card,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <Text style={[styles.statValue, { color: palette.text }]}>
                      {item.value}
                    </Text>
                    <Text style={[styles.statLabel, { color: palette.subtext }]}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* activities summary */}
              <Text style={[styles.subheading, { color: palette.text }]}>Activities</Text>

              <View style={styles.statsGrid}>
                {[
                  { value: summary.totalActivities, label: 'Activities' },
                  { value: summary.totalMinutes, label: 'Minutes' },
                  { value: summary.completedActivities, label: 'Completed Activities' },
                  { value: summary.topCategory, label: 'Top Category' },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: palette.card,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.statValue, { color: palette.text }]}
                      numberOfLines={1}
                    >
                      {item.value}
                    </Text>
                    <Text style={[styles.statLabel, { color: palette.subtext }]}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* chart block */}
              <View
                style={[
                  styles.chartCard,
                  { backgroundColor: palette.card, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.chartTitle, { color: palette.text }]}>
                  Minutes by Category
                </Text>

                <Text style={[styles.chartSubtitle, { color: palette.subtext }]}>
                  Total time spent across each category in this range.
                </Text>

                {summary.minutesByCategory.length === 0 ? (
                  <View
                    style={[
                      styles.emptyChartState,
                      { backgroundColor: palette.statBg, borderColor: palette.border },
                    ]}
                  >
                    <Text style={[styles.emptyText, { color: palette.subtext }]}>
                      No activity data available for this time range.
                    </Text>
                  </View>
                ) : (
                  <BarChart
                    data={{
                      labels: chartLabels,
                      datasets: [{ data: chartValues }],
                    }}
                    width={screenWidth - 64}
                    height={240}
                    yAxisLabel=""
                    yAxisSuffix=""
                    fromZero
                    showValuesOnTopOfBars
                    chartConfig={{
                      backgroundGradientFrom: palette.card,
                      backgroundGradientTo: palette.card,
                      decimalPlaces: 0,
                      color: () => palette.chartBar,
                      labelColor: () => palette.chartLabel,
                      barPercentage: 0.55,
                      propsForBackgroundLines: {
                        stroke: themeMode === 'dark' ? '#28405F' : '#E5DDD1',
                        strokeDasharray: '',
                      },
                    }}
                    style={styles.chart}
                    verticalLabelRotation={0}
                  />
                )}
              </View>
            </>
          )}
        </ScrollView>

        {/* nav bar styling */}
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
            <Text style={[styles.tabDot, { color: palette.tabInactive }]}>●</Text>
            <Text style={[styles.tabText, { color: palette.tabInactive }]}>Trips</Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => navigation.navigate('Insights')}
            accessibilityLabel="Insights tab"
          >
            <Text style={[styles.tabDot, { color: palette.tabActive }]}>●</Text>
            <Text style={[styles.tabTextActive, { color: palette.tabActive }]}>
              Insights
            </Text>
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
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },

  // extra bottom room for nav bar
  content: {
    paddingBottom: 110,
  },

  // top heading styling
  heroCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
  },
  heroTitle: {
    color: '#F8F5EF',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#D7DEE8',
    fontSize: 15,
    lineHeight: 22,
  },

  // range selector card
  filterCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  rangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rangeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  rangeChipText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // loading state
  loadingText: {
    fontSize: 16,
  },

  // main headings
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 14,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 4,
  },

  // stat card layout
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 22,
    paddingHorizontal: 18,
    justifyContent: 'center',
    minHeight: 112,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    lineHeight: 20,
  },

  // chart block
  chartCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  chartSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -8,
  },
  emptyChartState: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // bottom nav
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
});