import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { deleteUserById, getUserById } from '../utils/auth';
import { clearCurrentUserId, getCurrentUserId } from '../utils/authStorage';

type Props = {
  navigation: any;
};

export default function Profile({ navigation }: Props) {
  const [userName, setUserName] = useState<string>('User');
  const [userEmail, setUserEmail] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      async function loadUser() {
        const userId = await getCurrentUserId();

        if (!userId) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }

        const user = await getUserById(userId);

        if (!user) {
          await clearCurrentUserId();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }

        setUserName(user.name);
        setUserEmail(user.email);
      }

      loadUser();
    }, [navigation])
  );

  async function handleLogout() {
    await clearCurrentUserId();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }

  function handleDeleteProfile() {
    Alert.alert(
      'Delete profile',
      'Are you sure you want to delete your profile? This will also delete related trips, categories, activities, and targets.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const userId = await getCurrentUserId();

            if (!userId) {
              await clearCurrentUserId();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
              return;
            }

            await deleteUserById(userId);
            await clearCurrentUserId();

            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Name: {userName}</Text>
        <Text style={styles.subtitle}>Email: {userEmail}</Text>

        <View style={styles.buttonSpacing}>
          <Button title="Logout" onPress={handleLogout} />
        </View>

        <Button title="Delete Profile" onPress={handleDeleteProfile} color="#c62828" />
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
  buttonSpacing: {
    marginTop: 8,
  },
});