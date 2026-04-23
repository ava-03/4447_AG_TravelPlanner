import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function ThemeToggleCard() {
  const { themeMode, toggleTheme, colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            {themeMode === 'light' ? 'Light mode' : 'Dark mode'}
          </Text>
        </View>

        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={toggleTheme}
        >
          <Text style={[styles.buttonText, { color: colors.accent }]}>Switch</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  button: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});