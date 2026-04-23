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
  View,
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import TripForm from '../components/TripForm';
import { useTheme } from '../theme/ThemeContext';
import { getCurrentUserId } from '../utils/authStorage';
import { createTrip } from '../utils/trips';

type Props = {
  navigation: any;
};

export default function AddTrip({ navigation }: Props) {
  const { themeMode } = useTheme();

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

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
          accent: '#D4A853',
        }
      : {
          page: '#F5F0E8',
          hero: '#1A2E44',
          heroBorder: '#1A2E44',
          card: '#FFFFFF',
          border: '#DDD6CA',
          text: '#18212B',
          subtext: '#6B7280',
          accent: '#D4A853',
        };

  // Save trip
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
    
              <Text style={styles.heroTitle}>Add New Trip</Text>
              <Text style={styles.heroSubtitle}>
                Fill in the details below to create your next trip.
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
                Add your destination, dates and any notes you want to keep.
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
                onSubmit={handleSave}
                submitLabel="Save Trip"
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

  // Extra space at bottom for keyboard / smaller phones
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
  eyebrow: {
    color: '#D4A853',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.4,
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