import { StyleSheet, Text } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';

export default function CategoriesScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Categories</Text>
      <Text style={styles.subtitle}>Categories screen placeholder</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
  },
});