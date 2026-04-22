import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { getCurrentUserId } from '../utils/authStorage';
import { deleteTrip, getTripsByUserId } from '../utils/trips';

type Trip = {
  id: number;
  userId: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string | null;
};

type Props = {
  navigation: any;
};

export default function Trips({ navigation }: Props) {
  const [tripList, setTripList] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

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
    setTripList(rows);
    setLoading(false);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  function handleDeleteTrip(tripId: number, tripName: string) {
    Alert.alert(
      'Delete trip',
      `Are you sure you want to delete "${tripName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTrip(tripId);
            await loadTrips();
          },
        },
      ]
    );
  }

  function renderTripItem({ item }: { item: Trip }) {
    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => navigation.navigate('EditTrip', { tripId: item.id })}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.destination}</Text>
          <Text style={styles.cardDates}>
            {item.startDate} to {item.endDate}
          </Text>
          {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
        </TouchableOpacity>

        <View style={styles.cardButtons}>
          <View style={styles.cardButton}>
            <Button title="Edit" onPress={() => navigation.navigate('EditTrip', { tripId: item.id })} />
          </View>
          <View style={styles.cardButton}>
            <Button title="Delete" color="#c62828" onPress={() => handleDeleteTrip(item.id, item.name)} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Trips</Text>
        <Button title="Add Trip" onPress={() => navigation.navigate('AddTrip')} />
      </View>

      <View style={styles.topNavButtons}>
        <View style={styles.topNavButton}>
          <Button title="Activities" onPress={() => navigation.navigate('Activities')} />
        </View>
        <View style={styles.topNavButton}>
          <Button title="Categories" onPress={() => navigation.navigate('Categories')} />
        </View>
        <View style={styles.topNavButton}>
          <Button title="Targets" onPress={() => navigation.navigate('Targets')} />
        </View>
        <View style={styles.topNavButton}>
          <Button title="Insights" onPress={() => navigation.navigate('Insights')} />
        </View>
        <View style={styles.topNavButton}>
          <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
        </View>
      </View>

      {loading ? (
        <Text>Loading trips...</Text>
      ) : tripList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyText}>Tap "Add Trip" to create your first trip.</Text>
        </View>
      ) : (
        <FlatList
          data={tripList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTripItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  topNavButtons: {
    marginBottom: 18,
  },
  topNavButton: {
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  cardDates: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  cardNotes: {
    fontSize: 14,
    color: '#333',
  },
  cardButtons: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  cardButton: {
    flex: 1,
  },
  emptyState: {
    marginTop: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    backgroundColor: '#fff',
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