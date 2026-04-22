import { Ionicons } from '@expo/vector-icons';
import { Button, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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

const CATEGORY_COLORS = [
  '#3B82F6',
  '#F97316',
  '#22C55E',
  '#8B5CF6',
  '#EC4899',
  '#EF4444',
  '#14B8A6',
  '#EAB308',
  '#6366F1',
  '#6B7280',
];

const CATEGORY_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'camera',
  'restaurant',
  'walk',
  'bag',
  'leaf',
  'airplane',
  'bed',
  'business',
  'phone-portrait',
  'boat',
];

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

      <Text style={styles.label}>Choose a color</Text>
      <View style={styles.optionsRow}>
        {CATEGORY_COLORS.map((optionColor) => (
          <Pressable
            key={optionColor}
            onPress={() => setColor(optionColor)}
            style={[
              styles.colorOption,
              { backgroundColor: optionColor },
              color === optionColor && styles.selectedOption,
            ]}
            accessibilityLabel={`Select color ${optionColor}`}
          />
        ))}
      </View>

      <Text style={styles.label}>Choose an icon</Text>
      <View style={styles.optionsRow}>
        {CATEGORY_ICONS.map((optionIcon) => (
          <Pressable
            key={optionIcon}
            onPress={() => setIcon(optionIcon)}
            style={[
              styles.iconOption,
              icon === optionIcon && styles.selectedIconOption,
            ]}
            accessibilityLabel={`Select icon ${optionIcon}`}
          >
            <Ionicons name={optionIcon} size={22} color="#111" />
          </Pressable>
        ))}
      </View>

      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>Preview</Text>
        <View style={styles.previewRow}>
          <View
            style={[
              styles.previewIconCircle,
              { backgroundColor: color || '#ccc' },
            ]}
          >
            <Ionicons
              name={(icon as keyof typeof Ionicons.glyphMap) || 'pricetag'}
              size={22}
              color="#fff"
            />
          </View>
          <Text style={styles.previewText}>{name || 'Category name'}</Text>
        </View>
      </View>

      <Button title={loading ? 'Saving...' : submitLabel} onPress={onSubmit} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: -4,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#111',
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIconOption: {
    borderColor: '#111',
    backgroundColor: '#f3f4f6',
  },
  previewCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
  },
  previewLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
  },
});