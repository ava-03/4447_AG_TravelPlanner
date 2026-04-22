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
import ScreenContainer from '../components/ScreenContainer';
import TargetForm from '../components/TargetForm';
import { getCurrentUserId } from '../utils/authStorage';
import {
  getCategoriesForTargetUser,
  getTargetById,
  updateTarget,
} from '../utils/targets';

export default function EditTarget({ navigation, route }: any) {
  const { targetId } = route.params;

  const [tripId, setTripId] = useState(0);
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [goal, setGoal] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

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

      const categories = await getCategoriesForTargetUser(userId);
      const target = await getTargetById(targetId);

      if (!target) {
        Alert.alert('Not found', 'Target could not be found.');
        navigation.goBack();
        return;
      }

      setTripId(target.tripId);
      setCategoryOptions(categories.map((category) => ({ id: category.id, label: category.name })));
      setTitle(target.title);
      setPeriod(target.period as 'weekly' | 'monthly');
      setCategoryId(target.categoryId ?? null);
      setGoal(String(target.goal));
      setInitializing(false);
    }

    loadData();
  }, [navigation, targetId]);

  async function handleUpdate() {
    try {
      setLoading(true);

      if (!title.trim() || !goal.trim()) {
        Alert.alert('Missing details', 'Please complete all required fields.');
        return;
      }

      const parsedGoal = Number(goal);

      if (Number.isNaN(parsedGoal) || parsedGoal <= 0) {
        Alert.alert('Invalid goal', 'Goal must be a number greater than 0.');
        return;
      }

      await updateTarget(targetId, {
        tripId,
        categoryId,
        period,
        goal: parsedGoal,
        title,
      });

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update target.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return (
      <ScreenContainer>
        <Text>Loading target...</Text>
      </ScreenContainer>
    );
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
            <Text style={styles.title}>Edit Target</Text>

            <TargetForm
              title={title}
              setTitle={setTitle}
              period={period}
              setPeriod={setPeriod}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              goal={goal}
              setGoal={setGoal}
              categoryOptions={categoryOptions}
              onSubmit={handleUpdate}
              submitLabel="Update Target"
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