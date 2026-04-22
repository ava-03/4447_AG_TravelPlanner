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
import CategoryForm from '../components/CategoryForm';
import ScreenContainer from '../components/ScreenContainer';
import { getCategoryById, updateCategory } from '../utils/categories';

type Props = {
  navigation: any;
  route: {
    params: {
      categoryId: number;
    };
  };
};

export default function EditCategory({ navigation, route }: Props) {
  const { categoryId } = route.params;

  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [icon, setIcon] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function loadCategory() {
      const category = await getCategoryById(categoryId);

      if (!category) {
        Alert.alert('Not found', 'Category could not be found.');
        navigation.goBack();
        return;
      }

      setName(category.name);
      setColor(category.color);
      setIcon(category.icon);
      setInitializing(false);
    }

    loadCategory();
  }, [categoryId, navigation]);

  async function handleUpdate() {
    try {
      setLoading(true);

      if (!name.trim() || !color.trim() || !icon.trim()) {
        Alert.alert('Missing details', 'Please complete all fields.');
        return;
      }

      await updateCategory(categoryId, {
        name,
        color,
        icon,
      });

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update category.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return (
      <ScreenContainer>
        <Text>Loading category...</Text>
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
            <Text style={styles.title}>Edit Category</Text>

            <CategoryForm
              name={name}
              setName={setName}
              color={color}
              setColor={setColor}
              icon={icon}
              setIcon={setIcon}
              onSubmit={handleUpdate}
              submitLabel="Update Category"
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