import { Picker } from '@react-native-picker/picker';
import { Dimensions, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

import ScreenContainer from '../components/ScreenContainer';
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

    const completedTrips = filteredTrips.filter(
      (trip) => parseDate(trip.endDate) < now
    ).length;

    const upcomingTrips = filteredTrips.filter(
      (trip) => parseDate(trip.startDate) > now
    ).length;

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

    const minutesByCategory = Object.entries(minutesByCategoryMap).map(
      ([name, minutes]) => ({
        name,
        minutes,
      })
    );

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
        <Text style={styles.title}>Overall Insights</Text>

        <View style={styles.filterCard}>
  <Text style={styles.filterLabel}>Time Range</Text>

  <View style={styles.rangeRow}>
    <Pressable
      style={[
        styles.rangeChip,
        range === 'daily' && styles.rangeChipActive,
      ]}
      onPress={() => setRange('daily')}
    >
      <Text
        style={[
          styles.rangeChipText,
          range === 'daily' && styles.rangeChipTextActive,
        ]}
      >
        Daily
      </Text>
    </Pressable>

    <Pressable
      style={[
        styles.rangeChip,
        range === 'weekly' && styles.rangeChipActive,
      ]}
      onPress={() => setRange('weekly')}
    >
      <Text
        style={[
          styles.rangeChipText,
          range === 'weekly' && styles.rangeChipTextActive,
        ]}
      >
        Weekly
      </Text>
    </Pressable>

    <Pressable
      style={[
        styles.rangeChip,
        range === 'monthly' && styles.rangeChipActive,
      ]}
      onPress={() => setRange('monthly')}
    >
      <Text
        style={[
          styles.rangeChipText,
          range === 'monthly' && styles.rangeChipTextActive,
        ]}
      >
        Monthly
      </Text>
    </Pressable>

    <Pressable
      style={[
        styles.rangeChip,
        range === 'yearly' && styles.rangeChipActive,
      ]}
      onPress={() => setRange('yearly')}
    >
      <Text
        style={[
          styles.rangeChipText,
          range === 'yearly' && styles.rangeChipTextActive,
        ]}
      >
        Yearly
      </Text>
    </Pressable>
  </View>
</View>

        {loading ? (
          <Text style={styles.loadingText}>Loading insights...</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{getRangeTitle()}</Text>

            <Text style={styles.subheading}>Trips</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{summary.totalTrips}</Text>
                <Text style={styles.statLabel}>Total Trips</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{summary.completedTrips}</Text>
                <Text style={styles.statLabel}>Completed Trips</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{summary.activeTrips}</Text>
                <Text style={styles.statLabel}>Active Trips</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{summary.upcomingTrips}</Text>
                <Text style={styles.statLabel}>Upcoming Trips</Text>
              </View>
            </View>

            <Text style={styles.subheading}>Activities</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{summary.totalActivities}</Text>
                <Text style={styles.statLabel}>Activities</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{summary.totalMinutes}</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{summary.completedActivities}</Text>
                <Text style={styles.statLabel}>Completed Activities</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{summary.topCategory}</Text>
                <Text style={styles.statLabel}>Top Category</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Minutes by Category</Text>

              {summary.minutesByCategory.length === 0 ? (
                <Text style={styles.emptyText}>
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
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(17, 24, 39, ${opacity})`,
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
  content: {
    paddingBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 18,
  },
  filterCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
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
  borderRadius: 999,
  backgroundColor: '#f3f4f6',
  borderWidth: 1,
  borderColor: '#e5e7eb',
},

rangeChipActive: {
  backgroundColor: '#111',
  borderColor: '#111',
},

rangeChipText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
},

rangeChipTextActive: {
  color: '#fff',
},
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 14,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
  },
});