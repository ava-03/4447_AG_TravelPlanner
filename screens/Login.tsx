import { Button, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';

type Props = {
  navigation: any;
};

export default function LoginScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.title}>Trip Planner</Text>
        <Text style={styles.subtitle}>Login Screen</Text>

        <View style={styles.buttonSpacing}>
          <Button title="Login" onPress={() => navigation.replace('Trips')} />
        </View>

        <Button title="Go to Register" onPress={() => navigation.navigate('Register')} />
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
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  buttonSpacing: {
    marginBottom: 12,
  },
});