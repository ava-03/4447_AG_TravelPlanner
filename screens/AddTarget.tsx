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
import TargetForm from '../components/TargetForm';
import { useTheme } from '../theme/ThemeContext';
import { getCurrentUserId } from '../utils/authStorage';
import { getCategoriesForTargetUser, createTarget } from '../utils/targets';

export default function AddTarget({ navigation, route }: any) {
  const { tripId } = route.params;
  const { themeMode } = useTheme();

  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [goal, setGoal] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<
    { id: number; label: string }[]
  >([]);
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

  // Load category options
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

      setCategoryOptions(
        categories.map((category) => ({
          id: category.id,
          label: category.name,
        }))
      );
    }

    loadCategories();
  }, [navigation]);

  // Save target
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
      const message =
        error instanceof Error ? error.message : 'Failed to create target.';
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
              <Text style={styles.heroTitle}>Add Target</Text>

              <Text style={styles.heroSubtitle}>
                Set a weekly or monthly goal for this trip.
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
              <Text style={[styles.formTitle, { color: palette.text }]}>
                Target Details
              </Text>

              <Text style={[styles.formSubtitle, { color: palette.subtext }]}>
                Choose a category, period, and target amount.
              </Text>

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

  // Extra room at bottom
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