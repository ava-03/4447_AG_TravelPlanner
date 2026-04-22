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
} from 'react-native';
import ActivityForm from '../components/ActivityForm';
import ScreenContainer from '../components/ScreenContainer';
import { getCurrentUserId } from '../utils/authStorage';
import { createActivity, getCategoriesForUser, getTripsForUser } from '../utils/activities';

type Props = {
  navigation: any;
};

export default function AddActivity({ navigation }: Props) {
  const [tripId, setTripId] = useState(0);
  const [categoryId, setCategoryId] = useState(0);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('minutes');
  const [notes, setNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [tripOptions, setTripOptions] = useState<{ id: number; label: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadOptions() {
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

      setTripOptions(userTrips.map((trip) => ({ id: trip.id, label: trip.name })));
      setCategoryOptions(userCategories.map((category) => ({ id: category.id, label: category.name })));
    }

    loadOptions();
  }, [navigation]);

  async function handleSave() {
    try {
      setLoading(true);

      if (!tripId || !categoryId || !title.trim() || !date.trim() || !metricValue.trim()) {
        Alert.alert('Missing details', 'Please complete all required fields.');
        return;
      }

      const parsedMetric = Number(metricValue);

      if (Number.isNaN(parsedMetric) || parsedMetric <= 0) {
        Alert.alert('Invalid metric', 'Metric value must be a number greater than 0.');
        return;
      }

      await createActivity({
        tripId,
        categoryId,
        title,
        date,
        metricValue: parsedMetric,
        metricUnit,
        notes,
        isCompleted: isCompleted ? 1 : 0,
      });

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create activity.';
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
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
            <Text style={styles.title}>Add Activity</Text>

            <ActivityForm
              tripId={tripId}
              setTripId={setTripId}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              title={title}
              setTitle={setTitle}
              date={date}
              setDate={setDate}
              metricValue={metricValue}
              setMetricValue={setMetricValue}
              metricUnit={metricUnit}
              setMetricUnit={setMetricUnit}
              notes={notes}
              setNotes={setNotes}
              isCompleted={isCompleted}
              setIsCompleted={setIsCompleted}
              tripOptions={tripOptions}
              categoryOptions={categoryOptions}
              onSubmit={handleSave}
              submitLabel="Save Activity"
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