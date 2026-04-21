import { Button, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';

type Props = {
  navigation: any;
};

export default function ProfileScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Profile screen placeholder</Text>

        <Button title="Logout" onPress={() => navigation.replace('Login')} />
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
  },
});