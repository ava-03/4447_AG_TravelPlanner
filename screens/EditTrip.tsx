import { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import TripForm from '../components/TripForm';
import { useTheme } from '../theme/ThemeContext';
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
  const { themeMode } = useTheme();

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Simple screen palette
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
        }
      : {
          page: '#F5F0E8',
          hero: '#1A2E44',
          heroBorder: '#1A2E44',
          card: '#FFFFFF',
          border: '#DDD6CA',
          text: '#18212B',
          subtext: '#6B7280',
        };

  // Load current trip data into the form
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

  // Save updated trip
  async function handleUpdate() {
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
        <View style={[styles.loadingWrap, { backgroundColor: palette.page }]}>
          <Text style={[styles.loadingText, { color: palette.text }]}>Loading trip...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: palette.page }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top heading block */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: palette.hero,
                  borderColor: palette.heroBorder,
                },
              ]}
            >
              <Text style={styles.heroTitle}>Edit Trip</Text>
              <Text style={styles.heroSubtitle}>
                Update the details for this trip below.
              </Text>
            </View>

            {/* Form wrapper */}
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.formTitle, { color: palette.text }]}>Trip Details</Text>
              <Text style={[styles.formSubtitle, { color: palette.subtext }]}>
                Change the destination, dates or notes for this trip.
              </Text>

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
            </View>
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

  // Loading state
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Extra room at the bottom
  scrollContent: {
    paddingBottom: 40,
  },

  // Top heading styling
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

  // Form card styling
  formCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
});