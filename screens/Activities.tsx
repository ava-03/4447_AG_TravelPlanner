import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import ScreenContainer from '../components/ScreenContainer';
import {
  deleteActivity,
  filterActivities,
  getActivitiesByUserId,
  getCategoriesForUser,
} from '../utils/activities';
import { getCurrentUserId } from '../utils/authStorage';

type Activity = {
  id: number;
  tripId: number;
  categoryId: number;
  title: string;
  date: string;
  metricValue: number;
  metricUnit: string;
  notes: string | null;
  isCompleted: number;
};

type Props = {
  navigation: any;
};

function formatDisplayDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}-${month}-${year}`;
}

function formatDateForDb(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(isoDate: string) {
  if (!isoDate) return new Date();
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

export default function Activities({ navigation }: Props) {
  const [activityList, setActivityList] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; label: string }[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const loadActivities = useCallback(async () => {
    const userId = await getCurrentUserId();

    if (!userId) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }

    const [rows, categories] = await Promise.all([
      getActivitiesByUserId(userId),
      getCategoriesForUser(userId),
    ]);

    setActivityList(rows);

    setCategoryOptions(
      categories.map((category: { id: number; name: string }) => ({
        id: category.id,
        label: category.name,
      }))
    );

    setLoading(false);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  const filteredActivities = useMemo(() => {
    return filterActivities(activityList, {
      searchText,
      categoryId: selectedCategoryId,
      startDate,
      endDate,
    });
  }, [activityList, searchText, selectedCategoryId, startDate, endDate]);

  function handleDeleteActivity(activityId: number, title: string) {
    Alert.alert('Delete activity', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteActivity(activityId);
          await loadActivities();
        },
      },
    ]);
  }

  function handleStartDateChange(
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) {
    setShowStartPicker(false);

    if (event.type === 'dismissed' || !selectedDate) return;

    setStartDate(formatDateForDb(selectedDate));
  }

  function handleEndDateChange(
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) {
    setShowEndPicker(false);

    if (event.type === 'dismissed' || !selectedDate) return;

    setEndDate(formatDateForDb(selectedDate));
  }

  function clearFilters() {
    setSearchText('');
    setSelectedCategoryId(null);
    setStartDate('');
    setEndDate('');
  }

  function renderActivityItem({ item }: { item: Activity }) {
    return (
      <View style={styles.card}>
        <Pressable
          onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>
            {item.metricValue} {item.metricUnit}
          </Text>
          <Text style={styles.cardDate}>{formatDisplayDate(item.date)}</Text>
          <Text style={styles.cardStatus}>
            {item.isCompleted === 1 ? 'Completed' : 'Not completed'}
          </Text>
          {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
        </Pressable>

        <View style={styles.cardButtons}>
          <View style={styles.cardButton}>
            <Button
              title="Edit"
              onPress={() => navigation.navigate('EditActivity', { activityId: item.id })}
            />
          </View>
          <View style={styles.cardButton}>
            <Button
              title="Delete"
              color="#c62828"
              onPress={() => handleDeleteActivity(item.id, item.title)}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Activities</Text>
        <Button title="Add Activity" onPress={() => navigation.navigate('AddActivity')} />
      </View>

      <View style={styles.filtersCard}>
        <TextInput
          style={styles.input}
          placeholder="Search by title or notes"
          value={searchText}
          onChangeText={setSearchText}
          accessibilityLabel="Search activities input"
        />

        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedCategoryId ?? 0}
            onValueChange={(value) =>
              setSelectedCategoryId(Number(value) === 0 ? null : Number(value))
            }
          >
            <Picker.Item label="All categories" value={0} />
            {categoryOptions.map((category) => (
              <Picker.Item
                key={category.id}
                label={category.label}
                value={category.id}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.dateRow}>
          <Pressable
            style={styles.dateField}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={startDate ? styles.dateText : styles.placeholderText}>
              {startDate ? formatDisplayDate(startDate) : 'Start date'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.dateField}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={endDate ? styles.dateText : styles.placeholderText}>
              {endDate ? formatDisplayDate(endDate) : 'End date'}
            </Text>
          </Pressable>
        </View>

        <Button title="Clear Filters" onPress={clearFilters} />
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={parseIsoDate(startDate)}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={parseIsoDate(endDate)}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}

      {loading ? (
        <Text>Loading activities...</Text>
      ) : filteredActivities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No matching activities</Text>
          <Text style={styles.emptyText}>
            Try changing your search or filter settings.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderActivityItem}
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
  filtersCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#111',
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
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
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  cardStatus: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 8,
  },
  cardNotes: {
    fontSize: 14,
    color: '#333',
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
    marginTop: 20,
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