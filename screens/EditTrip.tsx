import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import TripForm from '../components/TripForm';
import { getTripById, updateTrip } from '../utils/trips';

type Props = {
  navigation: any;
  route: {
    params: {
      tripId: number;
    };
  };
};

export default function EditTrip({ navigation, route }: Props) {
  const { tripId } = route.params;

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function loadTrip() {
      const trip = await getTripById(tripId);

      if (!trip) {
        Alert.alert('Not found', 'Trip could not be found.');
        navigation.goBack();
        return;
      }

      setName(trip.name);
      setDestination(trip.destination);
      setStartDate(trip.startDate);
      setEndDate(trip.endDate);
      setNotes(trip.notes ?? '');
      setInitializing(false);
    }

    loadTrip();
  }, [tripId, navigation]);

  async function handleUpdate() {
    try {
      setLoading(true);

      if (!name.trim() || !destination.trim() || !startDate.trim() || !endDate.trim()) {
        Alert.alert('Missing details', 'Please complete all required fields.');
        return;
      }

      await updateTrip(tripId, {
        name,
        destination,
        startDate,
        endDate,
        notes,
      });

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update trip.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return (
      <ScreenContainer>
        <Text>Loading trip...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Edit Trip</Text>
      <TripForm
        name={name}
        setName={setName}
        destination={destination}
        setDestination={setDestination}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        notes={notes}
        setNotes={setNotes}
        onSubmit={handleUpdate}
        submitLabel="Update Trip"
        loading={loading}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
});