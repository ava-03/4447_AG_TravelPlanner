import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import ThemeToggleCard from '../components/ThemeToggleCard';
import { useTheme } from '../theme/ThemeContext';
import { deleteUserById, getUserById } from '../utils/auth';
import { clearCurrentUserId, getCurrentUserId } from '../utils/authStorage';

type Props = {
  navigation: any;
};

export default function Profile({ navigation }: Props) {
  const { colors } = useTheme();

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
      <View style={styles.page}>
        <View style={styles.infoSection}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>Name: {userName}</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>Email: {userEmail}</Text>
        </View>

        <View style={styles.actionsSection}>
          <Pressable
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={handleLogout}
          >
            <Text style={[styles.actionButtonText, { color: colors.accent }]}>Logout</Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={handleDeleteProfile}
          >
            <Text style={[styles.deleteButtonText, { color: colors.danger }]}>
              Delete Profile
            </Text>
          </Pressable>
        </View>

        <ThemeToggleCard />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'space-between',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  actionsSection: {
    gap: 12,
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});