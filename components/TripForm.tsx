import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

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

      <TextInput
        style={styles.input}
        placeholder="Start date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
        accessibilityLabel="Start date input"
      />

      <TextInput
        style={styles.input}
        placeholder="End date (YYYY-MM-DD)"
        value={endDate}
        onChangeText={setEndDate}
        accessibilityLabel="End date input"
      />

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
  notesInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});