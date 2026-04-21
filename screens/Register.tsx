import { Button, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';

type Props = {
  navigation: any;
};

export default function RegisterScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register Screen</Text>

        <View style={styles.buttonSpacing}>
          <Button title="Register" onPress={() => navigation.replace('Trips')} />
        </View>

        <Button title="Back to Login" onPress={() => navigation.goBack()} />
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
    fontSize: 30,
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