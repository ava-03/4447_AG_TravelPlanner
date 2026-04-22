import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Button,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

type Option = {
  id: number;
  label: string;
};

type ActivityFormProps = {
  tripId: number;
  setTripId: (value: number) => void;
  categoryId: number;
  setCategoryId: (value: number) => void;
  title: string;
  setTitle: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  metricValue: string;
  setMetricValue: (value: string) => void;
  metricUnit: string;
  setMetricUnit: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  isCompleted: boolean;
  setIsCompleted: (value: boolean) => void;
  tripOptions: Option[];
  categoryOptions: Option[];
  onSubmit: () => void;
  submitLabel: string;
  loading?: boolean;
};

function formatDisplayDate(isoDate: string) {
  if (!isoDate) return '';
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

export default function ActivityForm({
  tripId,
  setTripId,
  categoryId,
  setCategoryId,
  title,
  setTitle,
  date,
  setDate,
  metricValue,
  setMetricValue,
  metricUnit,
  setMetricUnit,
  notes,
  setNotes,
  isCompleted,
  setIsCompleted,
  tripOptions,
  categoryOptions,
  onSubmit,
  submitLabel,
  loading = false,
}: ActivityFormProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) return;

    setDate(formatDateForDb(selectedDate));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Trip</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={tripId} onValueChange={(value) => setTripId(Number(value))}>
          <Picker.Item label="Select trip" value={0} />
          {tripOptions.map((trip) => (
            <Picker.Item key={trip.id} label={trip.label} value={trip.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={categoryId} onValueChange={(value) => setCategoryId(Number(value))}>
          <Picker.Item label="Select category" value={0} />
          {categoryOptions.map((category) => (
            <Picker.Item key={category.id} label={category.label} value={category.id} />
          ))}
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Activity title"
        value={title}
        onChangeText={setTitle}
        accessibilityLabel="Activity title input"
      />

      <Pressable
        style={styles.dateField}
        onPress={() => setShowDatePicker(true)}
        accessibilityLabel="Activity date picker"
      >
        <Text style={date ? styles.dateText : styles.placeholderText}>
          {date ? formatDisplayDate(date) : 'Select activity date'}
        </Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={parseIsoDate(date)}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <TextInput
      style={styles.input}
      placeholder={metricUnit === 'minutes' ? 'Duration in minutes' : 'Count'}
      value={metricValue}
      onChangeText={setMetricValue}
      keyboardType="numeric"
      accessibilityLabel="Duration or count input"
    />

      <Text style={styles.label}>Activity Type</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={metricUnit} onValueChange={(value) => setMetricUnit(String(value))}>
          <Picker.Item label="Minutes" value="minutes" />
          <Picker.Item label="Count" value="count" />
        </Picker>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Completed</Text>
        <Switch value={isCompleted} onValueChange={setIsCompleted} />
      </View>

      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        accessibilityLabel="Activity notes input"
        blurOnSubmit={false}
      />

      <Button title={loading ? 'Saving...' : submitLabel} onPress={onSubmit} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: -6,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
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
  dateField: {
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
  notesInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});