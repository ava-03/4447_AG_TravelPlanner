import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { useTheme } from '../theme/ThemeContext';
import { deleteUserById, getUserById } from '../utils/auth';
import { clearCurrentUserId, getCurrentUserId } from '../utils/authStorage';
import { getTripsByUserId } from '../utils/trips';

type Props = {
  navigation: any;
};

type Trip = {
  id: number;
  userId: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
};

function parseDate(value: string) {
  const parts = value.split('-');

  if (parts[0]?.length === 4) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getTripStatus(startDate: string, endDate: string) {
  const today = startOfDay(new Date());
  const start = startOfDay(parseDate(startDate));
  const end = startOfDay(parseDate(endDate));

  if (today < start) return 'Upcoming';
  if (today > end) return 'Completed';
  return 'In Progress';
}

export default function Profile({ navigation }: Props) {
  const { themeMode, toggleTheme } = useTheme();

  const [userName, setUserName] = useState<string>('User');
  const [userEmail, setUserEmail] = useState<string>('');
  const [completedTripsCount, setCompletedTripsCount] = useState(0);
  const [upcomingTripsCount, setUpcomingTripsCount] = useState(0);

  // Profile screen palette
  const palette = themeMode === 'dark'
    ? {
        page: '#0F172A',
        hero: '#132A46',
        heroBorder: '#1F3D63',
        surface: '#111C2D',
        card: '#17263D',
        border: '#28405F',
        text: '#F8FAFC',
        subtext: '#C7D2E0',
        accent: '#D4A853',
        primary: '#C4622D',
        primaryText: '#FFFFFF',
        tabBg: '#13233A',
        tabActive: '#D4A853',
        tabInactive: '#AAB7C8',
        dangerBg: '#2A1E24',
        dangerBorder: '#5B3340',
        dangerText: '#FCA5A5',
      }
    : {
        page: '#F5F0E8',
        hero: '#1A2E44',
        heroBorder: '#1A2E44',
        surface: '#FFFDF9',
        card: '#FFFFFF',
        border: '#DDD6CA',
        text: '#18212B',
        subtext: '#6B7280',
        accent: '#D4A853',
        primary: '#C4622D',
        primaryText: '#FFFFFF',
        tabBg: '#FFFFFF',
        tabActive: '#C4622D',
        tabInactive: '#7A7A7A',
        dangerBg: '#FFF5F5',
        dangerBorder: '#F3C7C7',
        dangerText: '#C24141',
      };

  // First letter for the avatar
  const userInitial = useMemo(() => {
    return userName.trim().charAt(0).toUpperCase() || 'U';
  }, [userName]);

  // Load the current user whenever profile opens
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

        const [user, trips] = await Promise.all([
          getUserById(userId),
          getTripsByUserId(userId),
        ]);

        if (!user) {
          await clearCurrentUserId();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }

        const completedTrips = trips.filter((trip: Trip) => {
          return getTripStatus(trip.startDate, trip.endDate) === 'Completed';
        }).length;

        const upcomingTrips = trips.filter((trip: Trip) => {
          const status = getTripStatus(trip.startDate, trip.endDate);
          return status === 'Upcoming' || status === 'In Progress';
        }).length;

        setUserName(user.name);
        setUserEmail(user.email);
        setCompletedTripsCount(completedTrips);
        setUpcomingTripsCount(upcomingTrips);
      }

      loadUser();
    }, [navigation])
  );

  // Logout action
  async function handleLogout() {
    await clearCurrentUserId();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }

  // Delete profile action
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
      <View style={[styles.page, { backgroundColor: palette.page }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top profile card */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: palette.hero,
                borderColor: palette.heroBorder,
              },
            ]}
          >
            <View style={styles.avatarWrap}>
              <View style={[styles.avatarCircle, { backgroundColor: palette.accent }]}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
            </View>

            <Text style={[styles.nameText, { color: '#F8F5EF' }]}>{userName}</Text>
            <Text style={[styles.emailText, { color: '#D7DEE8' }]}>{userEmail}</Text>
          </View>

          {/* Trip totals */}
          <View style={styles.section}>
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Text style={[styles.statNumber, { color: palette.text }]}>
                  {completedTripsCount}
                </Text>
                <Text style={[styles.statLabel, { color: palette.subtext }]}>
                  Completed Trips
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Text style={[styles.statNumber, { color: palette.text }]}>
                  {upcomingTripsCount}
                </Text>
                <Text style={[styles.statLabel, { color: palette.subtext }]}>
                  Upcoming Trips
                </Text>
              </View>
            </View>
          </View>

          {/* Main settings block */}
          <View style={styles.section}>
            {/* Appearance row */}
            <View
              style={[
                styles.settingCard,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingTitle, { color: palette.text }]}>Appearance</Text>
                <Text style={[styles.settingSubtitle, { color: palette.subtext }]}>
                  {themeMode === 'dark' ? 'Dark mode' : 'Light mode'}
                </Text>
              </View>

              <Pressable
                style={[styles.settingButton, { backgroundColor: palette.hero }]}
                onPress={toggleTheme}
                accessibilityLabel="Toggle appearance"
              >
                <Text style={styles.settingButtonText}>Switch</Text>
              </Pressable>
            </View>
          </View>

          {/* Account actions */}
          <View style={styles.section}>
            <Pressable
              style={[
                styles.logoutButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
              onPress={handleLogout}
              accessibilityLabel="Logout"
            >
              <Text style={[styles.logoutButtonText, { color: palette.primary }]}>Log out</Text>
            </Pressable>

            <Pressable
              style={[
                styles.deleteButton,
                {
                  backgroundColor: palette.dangerBg,
                  borderColor: palette.dangerBorder,
                },
              ]}
              onPress={handleDeleteProfile}
              accessibilityLabel="Delete profile"
            >
              <Text style={[styles.deleteButtonText, { color: palette.dangerText }]}>
                Delete Profile
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Nav bar styling */}
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: palette.tabBg,
              borderColor: palette.border,
            },
          ]}
        >
          <Pressable
            style={styles.tabItem}
            onPress={() => navigation.navigate('Trips')}
            accessibilityLabel="Trips tab"
          >
            <Text style={[styles.tabDot, { color: palette.tabInactive }]}>●</Text>
            <Text style={[styles.tabText, { color: palette.tabInactive }]}>Trips</Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => navigation.navigate('Insights')}
            accessibilityLabel="Insights tab"
          >
            <Text style={[styles.tabDot, { color: palette.tabInactive }]}>●</Text>
            <Text style={[styles.tabText, { color: palette.tabInactive }]}>Insights</Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Profile tab"
          >
            <Text style={[styles.tabDot, { color: palette.tabActive }]}>●</Text>
            <Text style={[styles.tabTextActive, { color: palette.tabActive }]}>Profile</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },

  // Leaves room for the fixed nav bar
  scrollContent: {
    paddingBottom: 110,
  },

  // Top profile block
  heroCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrap: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
  },
  nameText: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 6,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Spacing between blocks
  section: {
    marginBottom: 16,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Settings row card
  settingCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Logout button
  logoutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoutButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },

  // Delete button
  deleteButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },

  // Bottom nav
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabDot: {
    fontSize: 10,
    lineHeight: 14,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: '800',
  },
});