import { Picker } from '@react-native-picker/picker';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

type CategoryOption = {
  id: number;
  label: string;
};

type TargetFormProps = {
  title: string;
  setTitle: (value: string) => void;
  period: 'weekly' | 'monthly';
  setPeriod: (value: 'weekly' | 'monthly') => void;
  categoryId: number | null;
  setCategoryId: (value: number | null) => void;
  goal: string;
  setGoal: (value: string) => void;
  categoryOptions: CategoryOption[];
  onSubmit: () => void;
  submitLabel: string;
  loading?: boolean;
};

export default function TargetForm({
  title,
  setTitle,
  period,
  setPeriod,
  categoryId,
  setCategoryId,
  goal,
  setGoal,
  categoryOptions,
  onSubmit,
  submitLabel,
  loading = false,
}: TargetFormProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Target title"
        value={title}
        onChangeText={setTitle}
        accessibilityLabel="Target title input"
      />

      <Text style={styles.label}>Period</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={period}
          onValueChange={(value) => setPeriod(value as 'weekly' | 'monthly')}
        >
          <Picker.Item label="Weekly" value="weekly" />
          <Picker.Item label="Monthly" value="monthly" />
        </Picker>
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={categoryId ?? 0}
          onValueChange={(value) => setCategoryId(Number(value) === 0 ? null : Number(value))}
        >
          <Picker.Item label="All categories" value={0} />
          {categoryOptions.map((category) => (
            <Picker.Item key={category.id} label={category.label} value={category.id} />
          ))}
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Goal in minutes"
        value={goal}
        onChangeText={setGoal}
        keyboardType="numeric"
        accessibilityLabel="Goal in minutes input"
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
});