import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { getCurrentUserId } from '../utils/authStorage';

type Props = {
  navigation: any;
};

export default function Trips({ navigation }: Props) {
  useFocusEffect(
    useCallback(() => {
      async function checkSession() {
        const userId = await getCurrentUserId();

        if (!userId) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }

      checkSession();
    }, [navigation])
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.title}>Trips</Text>
        <Text style={styles.subtitle}>Main app screen</Text>

        <View style={styles.buttonGroup}>
          <Button title="Activities" onPress={() => navigation.navigate('Activities')} />
        </View>
        <View style={styles.buttonGroup}>
          <Button title="Categories" onPress={() => navigation.navigate('Categories')} />
        </View>
        <View style={styles.buttonGroup}>
          <Button title="Targets" onPress={() => navigation.navigate('Targets')} />
        </View>
        <View style={styles.buttonGroup}>
          <Button title="Insights" onPress={() => navigation.navigate('Insights')} />
        </View>
        <View style={styles.buttonGroup}>
          <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
  },
  buttonGroup: {
    marginBottom: 12,
  },
});