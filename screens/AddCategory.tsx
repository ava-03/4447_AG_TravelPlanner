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
import CategoryForm from '../components/CategoryForm';
import ScreenContainer from '../components/ScreenContainer';
import { getCurrentUserId } from '../utils/authStorage';
import { createCategory } from '../utils/categories';

type Props = {
  navigation: any;
};

export default function AddCategory({ navigation }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [icon, setIcon] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      if (!name.trim() || !color.trim() || !icon.trim()) {
        Alert.alert('Missing details', 'Please complete all fields.');
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

      await createCategory({
        userId,
        name,
        color,
        icon,
      });

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category.';
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
            <Text style={styles.title}>Add Category</Text>

            <CategoryForm
              name={name}
              setName={setName}
              color={color}
              setColor={setColor}
              icon={icon}
              setIcon={setIcon}
              onSubmit={handleSave}
              submitLabel="Save Category"
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