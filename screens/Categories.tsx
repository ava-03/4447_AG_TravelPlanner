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
  const { themeMode } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);

  // Screen palette
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
          danger: '#FCA5A5',
          soft: '#111C2D',
        }
      : {
          page: '#F5F0E8',
          hero: '#1A2E44',
          heroBorder: '#1A2E44',
          card: '#FFFFFF',
          border: '#DDD6CA',
          text: '#18212B',
          subtext: '#6B7280',
          accent: '#C4622D',
          danger: '#C24141',
          soft: '#F8F5EF',
        };

  // Load user categories
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

  // Delete category
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

  // Single category card
  function renderCategory({ item }: { item: Category }) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.card,
            borderColor: palette.border,
          },
        ]}
      >
        <View style={styles.cardTop}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: item.color },
            ]}
          >
            <Ionicons name={item.icon as any} size={22} color="#fff" />
          </View>

          <View style={styles.textWrap}>
            <Text style={[styles.name, { color: palette.text }]}>
              {item.name}
            </Text>

            <Text style={[styles.helperText, { color: palette.subtext }]}>
              Used for organising trip activities
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[
              styles.smallButton,
              {
                backgroundColor: palette.soft,
                borderColor: palette.border,
              },
            ]}
            onPress={() =>
              navigation.navigate('EditCategory', {
                categoryId: item.id,
              })
            }
          >
            <Text style={[styles.smallButtonText, { color: palette.text }]}>
              Edit
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.smallButton,
              {
                backgroundColor: palette.soft,
                borderColor: palette.border,
              },
            ]}
            onPress={() => handleDeleteCategory(item)}
          >
            <Text style={[styles.smallButtonText, { color: palette.danger }]}>
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={[styles.page, { backgroundColor: palette.page }]}>
        {/* Top heading */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: palette.hero,
              borderColor: palette.heroBorder,
            },
          ]}
        >
          <Text style={styles.heroTitle}>Categories</Text>

          <Text style={styles.heroSubtitle}>
            Create categories to organise your travel activities.
          </Text>

          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate('AddCategory')}
          >
            <Text style={styles.addButtonText}>+ Add Category</Text>
          </Pressable>
        </View>

        {/* Category list */}
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
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: palette.text }]}>
                No categories yet
              </Text>

              <Text style={[styles.emptyText, { color: palette.subtext }]}>
                Tap Add Category to create your first one.
              </Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },

  // Top section
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
    marginBottom: 14,
  },
  addButton: {
    backgroundColor: '#C4622D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // List spacing
  listContent: {
    paddingBottom: 24,
  },

  // Card styling
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 14,
  },

  // Buttons row
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  smallButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  smallButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Empty state
  emptyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
  },
});