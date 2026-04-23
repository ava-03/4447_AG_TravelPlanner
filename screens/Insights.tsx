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
  const { colors, themeMode } = useTheme();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [range, setRange] = useState<InsightRange>('monthly');
  const [loading, setLoading] = useState(true);

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

    const minutesByCategory = Object.entries(minutesByCategoryMap).map(([name, minutes]) => ({
      name,
      minutes,
    }));

    let topCategory = 'None';
    if (minutesByCategory.length > 0) {
      const sorted = [...minutesByCategory].sort((a, b) => b.minutes - a.minutes);
      topCategory = sorted[0].name;
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

  const chartLabels = summary.minutesByCategory.map((item) =>
    item.name.length > 6 ? item.name.slice(0, 6) : item.name
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Overall Insights</Text>

        <View
          style={[
            styles.filterCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.filterLabel, { color: colors.subtext }]}>Time Range</Text>

          <View style={styles.rangeRow}>
            {(['daily', 'weekly', 'monthly', 'yearly'] as InsightRange[]).map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.rangeChip,
                  {
                    backgroundColor: colors.chip,
                    borderColor: colors.border,
                  },
                  range === item && {
                    backgroundColor: colors.chipActive,
                    borderColor: colors.chipActive,
                  },
                ]}
                onPress={() => setRange(item)}
              >
                <Text
                  style={[
                    styles.rangeChipText,
                    { color: colors.chipText },
                    range === item && { color: colors.chipTextActive },
                  ]}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {loading ? (
          <Text style={[styles.loadingText, { color: colors.subtext }]}>Loading insights...</Text>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{getRangeTitle()}</Text>

            <Text style={[styles.subheading, { color: colors.text }]}>Trips</Text>
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
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.subtext }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.subheading, { color: colors.text }]}>Activities</Text>
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
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.subtext }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.chartCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.chartTitle, { color: colors.text }]}>Minutes by Category</Text>

              {summary.minutesByCategory.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.subtext }]}>
                  No activity data available for this time range.
                </Text>
              ) : (
                <BarChart
                  data={{
                    labels: chartLabels,
                    datasets: [{ data: chartValues }],
                  }}
                  width={screenWidth - 64}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  fromZero
                  showValuesOnTopOfBars
                  chartConfig={{
                    backgroundGradientFrom: colors.card,
                    backgroundGradientTo: colors.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) =>
                      themeMode === 'dark'
                        ? `rgba(96, 165, 250, ${opacity})`
                        : `rgba(37, 99, 235, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      themeMode === 'dark'
                        ? `rgba(245, 247, 250, ${opacity})`
                        : `rgba(17, 24, 39, ${opacity})`,
                    barPercentage: 0.55,
                  }}
                  style={styles.chart}
                  verticalLabelRotation={0}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: '700', marginBottom: 18 },
  filterCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 18 },
  filterLabel: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
  rangeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  rangeChipText: { fontSize: 14, fontWeight: '600' },
  loadingText: { fontSize: 16 },
  sectionTitle: { fontSize: 24, fontWeight: '700', marginBottom: 14 },
  subheading: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  statCard: { width: '47%', borderWidth: 1, borderRadius: 14, padding: 16 },
  statValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 14 },
  chartCard: { borderWidth: 1, borderRadius: 14, padding: 16 },
  chartTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  chart: { borderRadius: 12 },
  emptyText: { fontSize: 15 },
});