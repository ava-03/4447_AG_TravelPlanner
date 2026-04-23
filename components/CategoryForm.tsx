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

const COLOR_OPTIONS = [
  '#3B82F6', 
  '#22C55E', 
  '#EF4444', 
  '#8B5CF6',
  '#F97316', 
  '#EAB308', 
  '#EC4899', 
  '#14B8A6', 
  '#6B7280', 
  '#8B5E3C', 
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
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Choose a color</Text>
      <View style={styles.colorGrid}>
        {COLOR_OPTIONS.map((optionColor: string) => (
          <Pressable
            key={optionColor}
            style={[
              styles.colorOptionOuter,
              color === optionColor && styles.selectedColorOuter,
            ]}
            onPress={() => setColor(optionColor)}
            accessibilityLabel={`Choose color ${optionColor}`}
          >
            <View
              style={[
                styles.colorOptionInner,
                { backgroundColor: optionColor },
              ]}
            />
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Choose an icon</Text>
      <View style={styles.iconGrid}>
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
            <Ionicons name={optionIcon} size={20} color="#111" />
          </Pressable>
        ))}
      </View>

      <Button
        title={loading ? 'Saving...' : submitLabel}
        onPress={onSubmit}
        disabled={loading}
      />
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: -2,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOptionOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorOuter: {
    borderColor: '#111',
  },
  colorOptionInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
});