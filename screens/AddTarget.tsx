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
import { getCategoriesForTargetUser, createTarget } from '../utils/targets';

export default function AddTarget({ navigation, route }: any) {
  const { tripId } = route.params;

  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [goal, setGoal] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const userId = await getCurrentUserId();

      if (!userId) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const categories = await getCategoriesForTargetUser(userId);
      setCategoryOptions(categories.map((category) => ({ id: category.id, label: category.name })));
    }

    loadCategories();
  }, [navigation]);

  async function handleSave() {
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

      const userId = await getCurrentUserId();

      if (!userId) {
        Alert.alert('Session expired', 'Please log in again.');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      await createTarget({
        userId,
        tripId,
        categoryId,
        period,
        goal: parsedGoal,
        title,
      });

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create target.';
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
            <Text style={styles.title}>Add Target</Text>

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
              onSubmit={handleSave}
              submitLabel="Save Target"
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