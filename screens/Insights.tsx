import { StyleSheet, Text } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';

export default function InsightsScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>Insights screen placeholder</Text>
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