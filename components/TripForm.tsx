import { useState } from 'react';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Button, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type TripFormProps = {
  name: string;
  setName: (value: string) => void;
  destination: string;
  setDestination: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
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

export default function TripForm({
  name,
  setName,
  destination,
  setDestination,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  notes,
  setNotes,
  onSubmit,
  submitLabel,
  loading = false,
}: TripFormProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  function handleStartDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS !== 'ios') {
      setShowStartPicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) return;

    setStartDate(formatDateForDb(selectedDate));
  }

  function handleEndDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS !== 'ios') {
      setShowEndPicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) return;

    setEndDate(formatDateForDb(selectedDate));
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Trip name"
        value={name}
        onChangeText={setName}
        accessibilityLabel="Trip name input"
      />

      <TextInput
        style={styles.input}
        placeholder="Destination"
        value={destination}
        onChangeText={setDestination}
        accessibilityLabel="Destination input"
      />

      <Pressable
        style={styles.dateField}
        onPress={() => setShowStartPicker(true)}
        accessibilityLabel="Start date picker"
      >
        <Text style={startDate ? styles.dateText : styles.placeholderText}>
          {startDate ? formatDisplayDate(startDate) : 'Select start date'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.dateField}
        onPress={() => setShowEndPicker(true)}
        accessibilityLabel="End date picker"
      >
        <Text style={endDate ? styles.dateText : styles.placeholderText}>
          {endDate ? formatDisplayDate(endDate) : 'Select end date'}
        </Text>
      </Pressable>

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

      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        accessibilityLabel="Notes input"
      />

      <Button title={loading ? 'Saving...' : submitLabel} onPress={onSubmit} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
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
});