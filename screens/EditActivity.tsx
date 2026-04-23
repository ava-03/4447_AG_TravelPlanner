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
import ActivityForm from '../components/ActivityForm';
import ScreenContainer from '../components/ScreenContainer';
import { useTheme } from '../theme/ThemeContext';
import {
  getActivityById,
  getCategoriesForUser,
  getTripsForUser,
  updateActivity,
} from '../utils/activities';
import { getCurrentUserId } from '../utils/authStorage';

type Props = {
  navigation: any;
  route: {
    params: {
      activityId: number;
    };
  };
};

export default function EditActivity({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { themeMode } = useTheme();

  const [tripId, setTripId] = useState(0);
  const [categoryId, setCategoryId] = useState(0);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [tripOptions, setTripOptions] = useState<{ id: number; label: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; label: string }[]>([]);
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

  // Load the activity and dropdown options
  useEffect(() => {
    async function loadData() {
      const userId = await getCurrentUserId();

      if (!userId) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const userTrips = await getTripsForUser(userId);
      const userCategories = await getCategoriesForUser(userId);
      const activity = await getActivityById(activityId);

      if (!activity) {
        Alert.alert('Not found', 'Activity could not be found.');
        navigation.goBack();
        return;
      }

      setTripOptions(userTrips.map((trip) => ({ id: trip.id, label: trip.name })));
      setCategoryOptions(
        userCategories.map((category) => ({ id: category.id, label: category.name }))
      );

      setTripId(activity.tripId);
      setCategoryId(activity.categoryId);
      setTitle(activity.title);
      setDate(activity.date);
      setDurationMinutes(String(activity.metricValue));
      setNotes(activity.notes ?? '');
      setIsCompleted(activity.isCompleted === 1);

      setInitializing(false);
    }

    loadData();
  }, [activityId, navigation]);

  // Save updated activity
  async function handleUpdate() {
    try {
      setLoading(true);

      if (!tripId || !categoryId || !title.trim() || !date.trim() || !durationMinutes.trim()) {
        Alert.alert('Missing details', 'Please complete all required fields.');
        return;
      }

      const parsedDuration = Number(durationMinutes);

      if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
        Alert.alert('Invalid duration', 'Duration must be a number greater than 0.');
        return;
      }

      await updateActivity(activityId, {
        tripId,
        categoryId,
        title,
        date,
        metricValue: parsedDuration,
        metricUnit: 'minutes',
        notes,
        isCompleted: isCompleted ? 1 : 0,
      });

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update activity.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return (
      <ScreenContainer>
        <View style={[styles.loadingWrap, { backgroundColor: palette.page }]}>
          <Text style={[styles.loadingText, { color: palette.text }]}>Loading activity...</Text>
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
              <Text style={styles.heroTitle}>Edit Activity</Text>
              <Text style={styles.heroSubtitle}>
                Update the details for this activity below.
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
              <Text style={[styles.formTitle, { color: palette.text }]}>Activity Details</Text>
              <Text style={[styles.formSubtitle, { color: palette.subtext }]}>
                Change the trip, category, date, duration or notes for this activity.
              </Text>

              <ActivityForm
                tripId={tripId}
                setTripId={setTripId}
                categoryId={categoryId}
                setCategoryId={setCategoryId}
                title={title}
                setTitle={setTitle}
                date={date}
                setDate={setDate}
                durationMinutes={durationMinutes}
                setDurationMinutes={setDurationMinutes}
                notes={notes}
                setNotes={setNotes}
                isCompleted={isCompleted}
                setIsCompleted={setIsCompleted}
                tripOptions={tripOptions}
                categoryOptions={categoryOptions}
                onSubmit={handleUpdate}
                submitLabel="Update Activity"
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