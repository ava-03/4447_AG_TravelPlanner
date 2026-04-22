import { Button, StyleSheet, TextInput, View } from 'react-native';

type CategoryFormProps = {
  name: string;
  setName: (value: string) => void;
  color: string;
  setColor: (value: string) => void;
  icon: string;
  setIcon: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  loading?: boolean;
};

export default function CategoryForm({
  name,
  setName,
  color,
  setColor,
  icon,
  setIcon,
  onSubmit,
  submitLabel,
  loading = false,
}: CategoryFormProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Category name"
        value={name}
        onChangeText={setName}
        accessibilityLabel="Category name input"
      />

      <TextInput
        style={styles.input}
        placeholder="Color hex (e.g. #3B82F6)"
        value={color}
        onChangeText={setColor}
        autoCapitalize="none"
        accessibilityLabel="Category color input"
      />

      <TextInput
        style={styles.input}
        placeholder="Icon name (e.g. camera)"
        value={icon}
        onChangeText={setIcon}
        autoCapitalize="none"
        accessibilityLabel="Category icon input"
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
});