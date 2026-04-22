import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import { getCurrentUserId } from '../utils/authStorage';
import { getTripsByUserId } from '../utils/trips';

export default function Trips({ navigation }: any) {
  const [trips, setTrips] = useState<any[]>([]);
  const [ascending, setAscending] = useState(true);

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

    rows.sort((a: any, b: any) =>
      ascending
        ? a.startDate.localeCompare(b.startDate)
        : b.startDate.localeCompare(a.startDate)
    );

    setTrips(rows);
  }, [ascending, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  return (
    <ScreenContainer>
      <Text style={styles.title}>My Trips</Text>

      <View style={styles.buttonRow}>
        <Button
          title="Add Trip"
          onPress={() => navigation.navigate('AddTrip')}
        />

        <Button
          title={ascending ? 'Newest First' : 'Oldest First'}
          onPress={() => setAscending(!ascending)}
        />
      </View>

      <View style={styles.buttonRow}>
        <Button
          title="Categories"
          onPress={() => navigation.navigate('Categories')}
        />

        <Button
          title="Insights"
          onPress={() => navigation.navigate('Insights')}
        />

        <Button
          title="Profile"
          onPress={() => navigation.navigate('Profile')}
        />
      </View>

      {trips.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyText}>
            Tap Add Trip to create your first trip.
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate('TripDetails', {
                  tripId: item.id,
                })
              }
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardText}>{item.destination}</Text>
              <Text style={styles.cardText}>
                {item.startDate} → {item.endDate}
              </Text>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 18,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },

  cardText: {
    fontSize: 15,
    color: '#555',
  },

  emptyBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 20,
    marginTop: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },

  emptyText: {
    color: '#555',
    fontSize: 15,
  },
});