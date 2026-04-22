import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import { getCurrentUserId } from '../utils/authStorage';
import { getTripsByUserId } from '../utils/trips';

type SortOption = 'nearest' | 'furthest' | 'recent' | 'az';

type Trip = {
  id: number;
  userId: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
};

export default function Trips({ navigation }: any) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('nearest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const loadTrips = useCallback(async () => {
    const userId = await getCurrentUserId();

    if (!userId) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }

    const rows = await getTripsByUserId(userId);
    const sorted = [...rows];

    if (sortBy === 'nearest') {
      sorted.sort(
        (a: Trip, b: Trip) =>
          parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime()
      );
    }

    if (sortBy === 'furthest') {
      sorted.sort(
        (a: Trip, b: Trip) =>
          parseDate(b.startDate).getTime() - parseDate(a.startDate).getTime()
      );
    }

    if (sortBy === 'recent') {
      sorted.sort((a: Trip, b: Trip) => b.id - a.id);
    }

    if (sortBy === 'az') {
      sorted.sort((a: Trip, b: Trip) => a.name.localeCompare(b.name));
    }

    setTrips(sorted);
  }, [navigation, sortBy]);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  function parseDate(value: string) {
    const parts = value.split('-');

    if (parts[0]?.length === 4) {
      return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
      );
    }

    return new Date(
      Number(parts[2]),
      Number(parts[1]) - 1,
      Number(parts[0])
    );
  }

  function formatDate(value: string) {
    const date = parseDate(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  function getSortLabel() {
    if (sortBy === 'nearest') return 'Nearest Trip';
    if (sortBy === 'furthest') return 'Furthest Trip';
    if (sortBy === 'recent') return 'Recently Added';
    return 'A-Z';
  }

  function chooseSort(option: SortOption) {
    setSortBy(option);
    setShowSortMenu(false);
  }

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Trips</Text>

        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate('AddTrip')}
        >
          <Text style={styles.addButtonText}>+ Add Trip</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.sortButton}
        onPress={() => setShowSortMenu(true)}
      >
        <Text style={styles.sortButtonLabel}>Sort by</Text>
        <Text style={styles.sortButtonValue}>{getSortLabel()} ▾</Text>
      </Pressable>

      <FlatList
        data={trips}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptyText}>
              Tap Add Trip to create your first trip.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('TripDetails', {
                tripId: item.id,
              })
            }
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.destination}>{item.destination}</Text>
            <Text style={styles.dateText}>
              {formatDate(item.startDate)} → {formatDate(item.endDate)}
            </Text>

            {item.notes ? (
              <Text style={styles.notes} numberOfLines={2}>
                {item.notes}
              </Text>
            ) : null}
          </Pressable>
        )}
      />

      <View style={styles.footerMenu}>
        <Pressable
          style={styles.menuButton}
          onPress={() => navigation.navigate('Categories')}
        >
          <Text style={styles.menuText}>Categories</Text>
        </Pressable>

        <Pressable
          style={styles.menuButton}
          onPress={() => navigation.navigate('Insights')}
        >
          <Text style={styles.menuText}>Insights</Text>
        </Pressable>

        <Pressable
          style={styles.menuButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.menuText}>Profile</Text>
        </Pressable>
      </View>

      <Modal
        visible={showSortMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSortMenu(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sort Trips</Text>

            <Pressable
              style={styles.optionButton}
              onPress={() => chooseSort('nearest')}
            >
              <Text style={styles.optionText}>Nearest Trip</Text>
            </Pressable>

            <Pressable
              style={styles.optionButton}
              onPress={() => chooseSort('furthest')}
            >
              <Text style={styles.optionText}>Furthest Trip</Text>
            </Pressable>

            <Pressable
              style={styles.optionButton}
              onPress={() => chooseSort('recent')}
            >
              <Text style={styles.optionText}>Recently Added</Text>
            </Pressable>

            <Pressable
              style={styles.optionButton}
              onPress={() => chooseSort('az')}
            >
              <Text style={styles.optionText}>A-Z</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '700',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },

  addButton: {
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },

  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  sortButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  sortButtonLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },

  sortButtonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },

  listContent: {
    paddingBottom: 30,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },

  destination: {
    fontSize: 16,
    color: '#444',
    marginBottom: 6,
  },

  dateText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
  },

  notes: {
    color: '#777',
    fontSize: 14,
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  emptyText: {
    color: '#666',
  },

  footerMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },

  menuButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  menuText: {
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },

  optionButton: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  optionText: {
    fontSize: 16,
    color: '#111',
  },
});