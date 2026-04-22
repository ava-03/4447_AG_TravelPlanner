import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

type CategoryMinutes = {
  name: string;
  minutes: number;
};

type TripInsightsCardProps = {
  totalMinutes: number;
  totalActivities: number;
  completedActivities: number;
  busiestCategory: string;
  minutesByCategory: CategoryMinutes[];
};

const screenWidth = Dimensions.get('window').width;

export default function TripInsightsCard({
  totalMinutes,
  totalActivities,
  completedActivities,
  busiestCategory,
  minutesByCategory,
}: TripInsightsCardProps) {
  const chartLabels = minutesByCategory.map((item) =>
    item.name.length > 6 ? item.name.slice(0, 6) : item.name
  );

  const chartData = minutesByCategory.map((item) => item.minutes);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Insights</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalMinutes}</Text>
          <Text style={styles.statLabel}>Total Minutes</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalActivities}</Text>
          <Text style={styles.statLabel}>Activities</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedActivities}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{busiestCategory}</Text>
          <Text style={styles.statLabel}>Top Category</Text>
        </View>
      </View>

      {minutesByCategory.length > 0 ? (
        <View style={styles.chartWrap}>
          <Text style={styles.chartTitle}>Minutes by Category</Text>
          <BarChart
            data={{
                labels: chartLabels,
                datasets: [{ data: chartData }],
            }}
            width={screenWidth - 72}
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
                barPercentage: 0.6,
            }}
            style={styles.chart}
            verticalLabelRotation={0}
            />
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No activity data yet for chart insights.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
  },
  chartWrap: {
    marginTop: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 12,
  },
  emptyChart: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  emptyText: {
    fontSize: 15,
    color: '#555',
  },
});