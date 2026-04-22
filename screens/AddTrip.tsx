import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import TripForm from '../components/TripForm';
import { getCurrentUserId } from '../utils/authStorage';
import { createTrip } from '../utils/trips';

type Props = {
  navigation: any;
};

export default function AddTrip({ navigation }: Props) {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      if (!name.trim() || !destination.trim() || !startDate.trim() || !endDate.trim()) {
        Alert.alert('Missing details', 'Please complete all required fields.');
        return;
      }

      if (endDate < startDate) {
        Alert.alert('Invalid dates', 'End date cannot be before start date.');
        return;
      }

      const userId = await getCurrentUserId();

      if (!userId) {
        Alert.alert('Session expired', 'Please log in again.');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      await createTrip({
        userId,
        name,
        destination,
        startDate,
        endDate,
        notes,
      });

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create trip.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Add New Trip</Text>

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
              onSubmit={handleSave}
              submitLabel="Save Trip"
              loading={loading}
            />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
});