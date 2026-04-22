import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { getCurrentUserId } from '../utils/authStorage';
import { deleteCategory, getCategoriesByUserId } from '../utils/categories';

type Category = {
  id: number;
  userId: number;
  name: string;
  color: string;
  icon: string;
};

type Props = {
  navigation: any;
};

function getIoniconName(iconName: string) {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    camera: 'camera',
    restaurant: 'restaurant',
    leaf: 'leaf',
    airplane: 'airplane',
    bed: 'bed',
    walk: 'walk',
    car: 'car',
    map: 'map',
    cafe: 'cafe',
    boat: 'boat',
    sun: 'sunny',
  };

  return iconMap[iconName] || 'pricetag';
}

export default function Categories({ navigation }: Props) {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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
    setCategoryList(rows);
    setLoading(false);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  function handleDeleteCategory(categoryId: number, name: string) {
    Alert.alert(
      'Delete category',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(categoryId);
            await loadCategories();
          },
        },
      ]
    );
  }

  function renderCategoryItem({ item }: { item: Category }) {
    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => navigation.navigate('EditCategory', { categoryId: item.id })}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: item.color || '#ccc' }]}>
              <Ionicons
                name={(item.icon as keyof typeof Ionicons.glyphMap) || 'pricetag'}
                size={22}
                color="#fff"
                />
            </View>

            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.smallColorDot, { backgroundColor: item.color || '#ccc' }]} />
                <Text style={styles.cardSubtitle}>{item.color}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.cardButtons}>
          <View style={styles.cardButton}>
            <Button
              title="Edit"
              onPress={() => navigation.navigate('EditCategory', { categoryId: item.id })}
            />
          </View>
          <View style={styles.cardButton}>
            <Button
              title="Delete"
              color="#c62828"
              onPress={() => handleDeleteCategory(item.id, item.name)}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Categories</Text>
        <Button title="Add Category" onPress={() => navigation.navigate('AddCategory')} />
      </View>

      {loading ? (
        <Text>Loading categories...</Text>
      ) : categoryList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No categories yet</Text>
          <Text style={styles.emptyText}>Tap "Add Category" to create one.</Text>
        </View>
      ) : (
        <FlatList
          data={categoryList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#555',
  },
  cardButtons: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  cardButton: {
    flex: 1,
  },
  emptyState: {
    marginTop: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
  },
});