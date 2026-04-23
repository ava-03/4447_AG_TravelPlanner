import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { useTheme } from '../theme/ThemeContext';
import { getCurrentUserId } from '../utils/authStorage';
import { deleteCategory, getCategoriesByUserId } from '../utils/categories';

type Props = {
  navigation: any;
};

type Category = {
  id: number;
  userId: number;
  name: string;
  color: string;
  icon: string;
};

export default function Categories({ navigation }: Props) {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = useCallback(async () => {
    const userId = await getCurrentUserId();

    if (!userId) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }

    const rows = await getCategoriesByUserId(userId);
    setCategories(rows);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  function handleDeleteCategory(category: Category) {
    Alert.alert(
      'Delete category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(category.id);
            await loadCategories();
          },
        },
      ]
    );
  }

  function renderCategory({ item }: { item: Category }) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: item.color },
            ]}
          >
            <Ionicons name={item.icon as any} size={22} color="#fff" />
          </View>

          <View style={styles.nameBlock}>
            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={() => navigation.navigate('EditCategory', { categoryId: item.id })}>
            <Text style={[styles.editText, { color: colors.accent }]}>Edit</Text>
          </Pressable>

          <Pressable onPress={() => handleDeleteCategory(item)}>
            <Text style={[styles.deleteText, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Categories</Text>

        <Pressable onPress={() => navigation.navigate('AddCategory')}>
          <Text style={[styles.addText, { color: colors.accent }]}>Add Category</Text>
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCategory}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No categories yet</Text>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Tap Add Category to create your first category.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  addText: {
    fontSize: 17,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 4,
  },
  editText: {
    fontSize: 17,
    fontWeight: '600',
  },
  deleteText: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
  },
});