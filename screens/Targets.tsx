import { StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';

export default function Targets() {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.title}>Trip Targets</Text>
        <Text style={styles.subtitle}>
          Targets are managed inside each trip so you can track how busy or balanced that specific trip is.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
  },
});